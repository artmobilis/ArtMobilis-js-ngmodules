/**
* @class angular_module.journey.JourneySceneSvc
* @memberOf angular_module.journey
*/



angular.module('journey')

.service('JourneySceneSvc', [
  'JourneyManagerSvc',
  'DataManagerSvc',
  'MarkerDetectorSvc',
  'CameraSvc',
  'LoadingSvc',
  'journeyType',
  (function() {

  function JourneySceneSvc(
    JourneyManagerSvc,
    DataManagerSvc,
    MarkerDetectorSvc,
    CameraSvc,
    LoadingSvc,
    journeyType) {


    var _camera_video_element = CameraSvc.GetVideoElement();

    var _running = false;
    var _loading = false;

    var _journey;

    var _promise = Promise.resolve();

    var _scene = new THREE.Scene();
    var _user_head = new THREE.Object3D();
    var _user_body = new THREE.Object3D();
    _user_body.add(_user_head);
    _scene.add(_user_body);

    _scene.add(new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 ));
    _scene.add(new THREE.AmbientLight( 0x404040 ));

    var _orientation_control = new AM.DeviceOrientationControl(_user_head);

    var _tracked_obj_manager = new AMTHREE.TrackedObjManager( {
      camera: _user_head,
      lerp_track_factor: 0.01,
      lerp_update_factor: 0.3,
      damping_factor: 0.9,
      timeout: 10
    } );

    var _poi_limit_obj = new THREE.Object3D();
    _scene.add(_poi_limit_obj);

    var _poi_objects;

    var _use_fixed_angle = false;

    var _use_web_worker = true;

    var _device_mode = true;


    var AddPOIMarkers = (function() {

      function Adder(channel_uuid) {
        return function(object) {
          AMTHREE.PlayAnimatedTextures(object);
          AMTHREE.PlaySounds(object);
          _scene.add(object);
          MarkerDetectorSvc.ActiveAllMarkers(false);
          MarkerDetectorSvc.ActiveMarker(channel_uuid, true);
        };
      }

      function Remover(channel_uuid) {
        return function(objet) {
          _scene.remove(objet);
          AMTHREE.StopSounds(objet);
          AMTHREE.StopAnimatedTextures(objet);
          MarkerDetectorSvc.ActiveAllMarkers(true);
        };
      }

      return function() {

        var poi = JourneyManagerSvc.GetCurrentPOI();
        if (!poi)
          return;

        var data_journey = DataManagerSvc.GetData();
        var channels = data_journey.channels;
        var markers = data_journey.markers;

        for (var i = 0, c = poi.channels.length; i < c; ++i) {
          var poi_channel = poi.channels[i];
          var channel_uuid = poi_channel.uuid;
          var channel = channels[channel_uuid];
          var marker = markers[channel.marker];

          if (!marker)
            continue;

          if (marker.type === 'img')
            MarkerDetectorSvc.AddMarker(marker.url, channel_uuid);

          var object = channel.BuildContents(data_journey.objects);

          _tracked_obj_manager.Add(object, channel_uuid,
            new Adder(channel_uuid), new Remover(channel_uuid));
        }
      
      };
    })();

    function OnEnterPOI() {
      AddPOIMarkers();

      var poi = JourneyManagerSvc.GetCurrentPOI();
      var objects = DataManagerSvc.GetData().objects;

      _poi_limit_obj.add(poi.CreateBoundsObject());

      _poi_objects = poi.CreateScene(objects);
      _scene.add(_poi_objects);
      AMTHREE.PlayAnimatedTextures(_poi_objects);
      AMTHREE.PlaySounds(_poi_objects);
    }

    function OnExitPOI() {
      Reset();
    }

    function OnJourneyModeChange() {
      var mode = JourneyManagerSvc.GetMode();

      switch (mode) {

        case JourneyManagerSvc.MODE_NAVIGATION:
        case JourneyManagerSvc.MODE_NAVIGATION_FORCED:
        OnExitPOI();
        break;

        case JourneyManagerSvc.MODE_POI:
        OnEnterPOI();
        break;
      }
    }

    function StartMarkerDetector() {
      if (!MarkerDetectorSvc.Started()) {
        MarkerDetectorSvc.Start(_camera_video_element, _use_web_worker);
      }
    }

    function OnDeviceMove(e) {
      var vec = new THREE.Vector3(e.detail.x - _user_body.position.x, 0, e.detail.y - _user_body.position.z);
      _tracked_obj_manager.MoveEnabledObjects(vec);
      _user_body.position.x = e.detail.x;
      _user_body.position.z = e.detail.y;
    }

    /**
    * @function
    * @memberOf angular_module.journey.JourneySceneSvc
    * @description Starts the service, and starts the services it depends on, MarkerDetectorSvc, JourneyManagerSvc, CameraSvc.
    * @param {bool} [use_web_worker=true] - If true, uses a Web Worker for the image detection computations.
    */
    function Start(use_web_worker) {
      if (Started())
        return;

      _use_web_worker = (typeof use_web_worker === 'boolean') ? use_web_worker : true;

      AddTasks(
        function() { return DataManagerSvc.GetLoadPromise(); },
        function() {
          _loading = true;

          JourneyManagerSvc.Reset();

          StartMarkerDetector();
          document.addEventListener('journey_mode_change', OnJourneyModeChange, false);

          document.addEventListener('device_move_xy', OnDeviceMove, false);
          _orientation_control.Connect();

          _running = true; 
        }
      );

      return AddTasks(function() {
        _loading = false;
      });
    }

    /**
    * @function
    * @memberOf angular_module.journey.JourneySceneSvc
    * @description Returns true if started or loading.
    * @returns {bool}
    */
    function Started() {
      return _running || _loading;
    }

    /**
    * @function
    * @memberOf angular_module.journey.JourneySceneSvc
    * @description Stops the service, and the services it depends on.
    */
    function Stop() {
      if (!Started())
        return;

      return AddTasks(function() {
        Reset();

        document.removeEventListener('journey_mode_change', OnJourneyModeChange, false);
        document.removeEventListener('device_move_xy', OnDeviceMove, false);
        _orientation_control.Disconnect();
        _running = false;
        MarkerDetectorSvc.Stop();

      });
    }

    function UpdateTracking(angle) {
      //MarkerDetectorSvc.Empty();
      MarkerDetectorSvc.Update(angle);

      var tags = MarkerDetectorSvc.GetTags();
      var marker_corners = MarkerDetectorSvc.GetMarker();

      var data_journey = DataManagerSvc.GetData();
      var channels = data_journey.channels;
      var markers = data_journey.markers;

      for (var i = 0, c = tags.length; i < c; ++i) {
        var tag = tags[i];
        console.log('tag detected: ' + tag.id);
        var poi_channels = JourneyManagerSvc.GetCurrentPOI().channels;
        for (var i2 = 0, c2 = poi_channels.length; i2 < c2; ++i2) {
          var poi_channel = poi_channels[i2];
          var channel = channels[poi_channel.uuid];
          var marker = markers[channel.marker];
          if (marker && marker.type === 'tag' && marker.tag_id === tag.id) {
            MarkerDetectorSvc.SetTransform(tag);
            _tracked_obj_manager.TrackCompose(poi_channel.uuid,
              MarkerDetectorSvc.position,
              MarkerDetectorSvc.quaternion,
              MarkerDetectorSvc.scale);
          }
        }
      }

      if (marker_corners) {
//        console.log('image processed, no marker detected');
        if (marker_corners.matched) {
          console.log('marker detected: ' + marker_corners.uuid);
          MarkerDetectorSvc.SetTransform(marker_corners);
          _tracked_obj_manager.TrackCompose(marker_corners.uuid,
            MarkerDetectorSvc.position,
            MarkerDetectorSvc.quaternion,
            MarkerDetectorSvc.scale);
        }
      }

      _tracked_obj_manager.Update();
    }

    /**
    * @function
    * @memberOf angular_module.journey.JourneySceneSvc
    * @description Updates the scene.
    */
    function Update() {
      if (!Started())
        return;
            
      _orientation_control.Update();

      if (JourneyManagerSvc.GetMode() === JourneyManagerSvc.MODE_POI) {
        if (_use_fixed_angle) {
          var alpha = 0;
          if (_device_mode) {
            var half_pi = Math.PI / 2;
            alpha = half_pi * (Math.round(_orientation_control.alpha / half_pi) - 1);
          }
          UpdateTracking(alpha);
        }
        else
          UpdateTracking();
      }

      AMTHREE.UpdateAnimatedTextures(_scene);
    }

    /**
    * @function
    * @memberOf angular_module.journey.JourneySceneSvc
    * @description Returns an object on the scene, representation of the head of the user. This object is a child of the body object.
    * @returns {THREE.Object3D}
    */
    function GetUserHead() {
      return _user_head;
    }

    /**
    * @function
    * @memberOf angular_module.journey.JourneySceneSvc
    * @description Returns an object on the scene, representation of the body of the user. This object is the parent of the head object.
    * @returns {THREE.Object3D}
    */
    function GetUserBody() {
      return _user_body;
    }

    function AddTasks() {
      LoadingSvc.Start();
      (function(args) {
        _promise = _promise.then(function() {
          var p = Promise.all(args.map(function(e) {
            return e();
          }));
          return p;
        }).then(function() {
          LoadingSvc.End();
        });
      })(Array.prototype.slice.call(arguments));

      return _promise;
    }

    /**
    * @function
    * @memberOf angular_module.journey.JourneySceneSvc
    * @description Returns the scene.
    * @returns {THREE.Scene}
    */
    function GetScene() {
      return _scene;
    }

    function Reset() {
      if (_poi_objects) {
        AMTHREE.StopAnimatedTextures(_poi_objects);
        AMTHREE.StopSounds(_poi_objects);
      }
      _poi_limit_obj.remove.apply(_poi_limit_obj, _poi_limit_obj.children);
      _scene.remove(_poi_objects);
      _poi_objects = undefined;

      MarkerDetectorSvc.ClearMarkers();
      _tracked_obj_manager.Clear();
    }

    /**
    * @function
    * @memberOf angular_module.journey.JourneySceneSvc
    * @description Sets whether corner orientation should be computed, or if the angle is given for each image.
    * @param {boolean} bool - If false, corner orientation is computed, which is the default behaviour.
    */
    function DetectionUseFixedAngle(bool) {
      if (bool !== _use_fixed_angle) {
        MarkerDetectorSvc.UseFixedAngle(bool);
        _use_fixed_angle = bool;
        if (_running) {
          Stop();
          window.setTimeout(function() {
            Start(_use_web_worker);
          }, 0);
        }
      }
    }

    /**
    * Enables or disables the device mode. If fixed angle mode enabled, the angle used is the device's, 0 otherwise.
    * @function
    * @memberOf angular_module.journey.JourneySceneSvc
    * @param {boolean} bool
    */
    function SetDeviceMode(bool) {
      _device_mode = bool;
    }

    this.Start = Start;
    this.Started = Started;
    this.Stop = Stop;
    this.Update = Update;
    this.GetUserBody = GetUserBody;
    this.GetUserHead = GetUserHead;
    this.GetScene = GetScene;
    this.DetectionUseFixedAngle = DetectionUseFixedAngle;
    this.SetDeviceMode = SetDeviceMode;
  }

  return JourneySceneSvc;

})()]);