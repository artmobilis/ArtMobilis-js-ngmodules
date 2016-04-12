var JourneySceneSvc = (function() {

  DrawBubble = function(ctx, x, y, width, height, radius) {
    var x_min = x - (width / 2);
    var x_max = x_min + width;
    var y_min = y - (height / 2);
    var y_max = y_min + height;

    ctx.beginPath();

    ctx.moveTo(x_min, y_min + radius);
    ctx.lineTo(x_min, y_max - radius);
    ctx.quadraticCurveTo(x_min, y_max, x_min + radius, y_max);
    ctx.lineTo(x_max - radius, y_max);
    ctx.quadraticCurveTo(x_max, y_max, x_max, y_max - radius);
    ctx.lineTo(x_max, y_min + radius);
    ctx.quadraticCurveTo(x_max, y_min, x_max - radius, y_min);
    ctx.lineTo(x_min + radius, y_min);
    ctx.quadraticCurveTo(x_min, y_min, x_min, y_min + radius);

    ctx.fill();
  };


  return function($ionicPlatform, JourneyManagerSvc, DataManagerSvc,
    MarkerDetectorSvc, CameraSvc, LoadingSvc, objectFactory,
    CoordinatesConverterSvc, Journey) {
    var that = this;

    var _image_loader = new AM.ImageLoader();
    var _camera_video_element = CameraSvc.GetVideoElement();

    var _running = false;
    var _loading = false;

    var _journey;

    var _loading_manager = new AM.LoadingManager();
    var _starting_manager = new AM.LoadingManager();

    var _canvas3d = document.createElement('canvas');
    var _scene = new AMTHREE.Scene( {
      gps_converter: function(latitude, longitude) {
        return CoordinatesConverterSvc.ConvertLocalCoordinates(latitude, longitude);
      },
      canvas: _canvas3d,
      fov: (ionic.Platform.isWebView()) ? 80 : 40
    } );
    _scene.SetFullWindow();
    _scene.AddObject(new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 ));
    _scene.AddObject(new THREE.AmbientLight( 0x404040 ));

    var _canvas2d = document.createElement('canvas');
    _canvas2d.style = "position: absolute; left:0px; right:0px; background-color: transparent;";
    var _context2d = _canvas2d.getContext('2d');

    var _orientation_control = new AM.DeviceOrientationControl(_scene.GetCamera());

    var _tracked_obj_manager = new AMTHREE.TrackedObjManager( {
      camera: _scene.GetCamera(),
      lerp_factor: 0.05,
      timeout: 10
    } );

    var _poi_limit_obj = new THREE.Mesh(new THREE.RingGeometry(1, 1.3, 64),
      new THREE.MeshBasicMaterial( { color: 0x41A3DC, opacity: 0.5, transparent: true, side: THREE.DoubleSide } ));
    _poi_limit_obj.position.y = -3;
    _poi_limit_obj.rotation.x = 1.5708;

    var _poi_landmarks;

    var _channels_landmarks;

    var _debugMatches=false;
    var _marker_corners;
    var _image_debugger= new AM.ImageDebugger();
    _image_debugger.SetData(_context2d, _camera_video_element, _debugMatches);


    function OnWindowResize() {
      _canvas2d.width = window.innerWidth;
      _canvas2d.height = window.innerHeight;
    }

    function AddPOIMarkers() {
      var poi = JourneyManagerSvc.GetCurrentPOI();
      if (!poi)
        return;

      DataManagerSvc.GetLoadPromise().then(function() {
        var data_journey = DataManagerSvc.GetData();
        var channels = data_journey.channels;
        var markers = data_journey.markers;

        for (poi_channel of poi.channels) {
          var channel_uuid = poi_channel.uuid;
          var channel = channels[channel_uuid];
          var marker = markers[channel.marker];

          if (marker.type === 'img')
            MarkerDetectorSvc.AddMarker(marker.url, channel_uuid);

          var object = objectFactory.BuildChannelContents(channel_uuid, DataManagerSvc.GetData());

          (function(channel_uuid) {
            _tracked_obj_manager.Add(object, channel_uuid, function(o) {
              AMTHREE.PlayAnimatedTextures(o);
              AMTHREE.PlaySounds(o);
              _scene.AddObject(o);
              MarkerDetectorSvc.ActiveAllMarkers(false);
              MarkerDetectorSvc.ActiveMarker(channel_uuid, true);
            }, function(o) {
              _scene.RemoveObject(o);
              AMTHREE.StopSounds(o);
              AMTHREE.StopAnimatedTextures(o);
              MarkerDetectorSvc.ActiveAllMarkers(true);
            });
          })(channel_uuid);

        }
        
      });
    }

    function OnEnterPOI() {
      AddPOIMarkers();

      var poi = JourneyManagerSvc.GetCurrentPOI();

      _poi_limit_obj.scale.x = _poi_limit_obj.scale.y = _poi_limit_obj.scale.z = poi.radius;
      _poi_limit_obj.position.x = poi.position.x;
      _poi_limit_obj.position.z = poi.position.y;
      _scene.AddObject(_poi_limit_obj);

      _channels_landmarks = JourneyManagerSvc.GetPOIChannelsLandmarks();
      _scene.AddObject(_channels_landmarks);
    }

    function OnExitPOI() {
      _scene.RemoveObject(_poi_limit_obj);
      _scene.RemoveObject(_channels_landmarks);
      _channels_landmarks = undefined;

      MarkerDetectorSvc.ClearMarkers();
      _tracked_obj_manager.Clear();
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

    function StartCamera() {
      if (!CameraSvc.IsActive()) {

        _loading_manager.Start();
        LoadingSvc.Start();

        CameraSvc.Start(function() {
          _loading_manager.End();
          LoadingSvc.End();
        });

      }
    }

    function StartMarkerDetector(use_web_worker) {
      if (!MarkerDetectorSvc.Started()) {
        MarkerDetectorSvc.Start(_camera_video_element, use_web_worker);
      }
    }

    function LoadData() {
      LoadingSvc.Start();
      _loading_manager.Start();
      DataManagerSvc.LoadPresets();
      return DataManagerSvc.GetLoadPromise().then(function() {
        AddPOILandmarks();
        LoadingSvc.End();
        _loading_manager.End();
      }, console.warn);
    }

    function LoadNavigationScene() {
      _loading_manager.Start();
      LoadingSvc.Start();

      _scene.Load('./assets/navigation_scene.json', function() {
        _loading_manager.End();
        LoadingSvc.End();
      });
    }

    function AddPOILandmarks() {
      LoadingSvc.Start();
      _loading_manager.Start();

      DataManagerSvc.GetLoadPromise().then(function() {
        _poi_landmarks = JourneyManagerSvc.GetPOILandmarks();
        _scene.AddObject(_poi_landmarks);
        _loading_manager.End();
        LoadingSvc.End();
      });
    }


    function Load(use_web_worker) {
      _loading_manager.Start();
      LoadingSvc.Start();

      $ionicPlatform.ready(function() {

        StartCamera();

        LoadData();

        StartMarkerDetector(use_web_worker);

        LoadNavigationScene();

        _loading_manager.End();
        LoadingSvc.End();
      });
    }

    function OnDeviceMove(e) {
      var body = _scene.GetCameraBody();
      body.position.x = e.detail.x;
      body.position.z = e.detail.y;
    }

    this.Start = function(use_web_worker) {
      if (that.Started())
        return;

      _starting_manager.Start();
      LoadingSvc.Start();
      _starting_manager.OnEnd(function() {
        LoadingSvc.End();
      });

      Load(use_web_worker);

      _loading_manager.OnEnd(function() {
        JourneyManagerSvc.Start();

        document.addEventListener('journey_mode_change', OnJourneyModeChange, false);

        document.addEventListener('device_move_xy', OnDeviceMove, false);
        _orientation_control.Connect();

        window.addEventListener('resize', OnWindowResize, false);
        OnWindowResize();

        _running = true;

        LoadingSvc.End();
        _starting_manager.End();
      });
    };

    this.Started = function() {
      return _running || _starting_manager.IsLoading();
    };

    this.Stop = function() {
      if (!that.Started())
        return;
      
      _starting_manager.OnEnd(function() {
        JourneyManagerSvc.Stop();
        _scene.StopFullWindow();
        document.removeEventListener('journey_mode_change', OnJourneyModeChange, false);
        document.removeEventListener('device_move_xy', OnDeviceMove, false);
        window.removeEventListener('resize', OnWindowResize, false);
        _orientation_control.Disconnect();
        _running = false;
        MarkerDetectorSvc.Stop();
        CameraSvc.Stop();
      });
    };

    this.GetCanvas = function() {
      return _canvas2d;
    };

    function OnCanvas(x, y, canvas) {
      return (0 <= x && x < canvas.width && 0 <= y && y < canvas.height);
    }

    function UpdateTracking() {
      MarkerDetectorSvc.Update();

      var tags = MarkerDetectorSvc.GetTags();
      var marker_corners = MarkerDetectorSvc.GetMarker();

      var data_journey = DataManagerSvc.GetData();
      var channels = data_journey.channels;
      var markers = data_journey.markers;

      for (tag of tags) {
        console.log('tag detected: ' + tag.id);
        for (poi_channel of JourneyManagerSvc.GetCurrentPOI().channels) {
          var channel = channels[poi_channel.uuid];
          var marker = markers[channel.marker];
          if (marker.type === 'tag' && marker.tag_id === tag.id) {
            MarkerDetectorSvc.SetTransform(tag);
            _tracked_obj_manager.TrackCompose(poi_channel.uuid,
              MarkerDetectorSvc.position,
              MarkerDetectorSvc.quaternion,
              MarkerDetectorSvc.scale);
          }
        }
      }

      if (marker_corners) {
        console.log('image processed, no marker detected');
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

    function UpdateDebugger() {
      var marker_corners = MarkerDetectorSvc.GetMarker();

      if (marker_corners === undefined)  {
        if( _marker_corners === undefined) 
          return;
        marker_corners = _marker_corners; // use last detection for continuous display
      }

      _image_debugger.UpdateSize(_canvas2d, MarkerDetectorSvc.video_size_target);
      _image_debugger.DrawCorners(marker_corners);

      if (marker_corners.matched){
        var data_journey = DataManagerSvc.GetData();
        var channel = data_journey.channels[marker_corners.uuid];
        var url = data_journey.markers[channel.marker].url;

        _image_debugger.DebugMatching(marker_corners, url);
      }
      _marker_corners= marker_corners;
    }

    function UpdateBubbles() {
      var data_journey = DataManagerSvc.GetData();
      var journey = data_journey.journey;
      var pois = data_journey.pois;

      var poi_position = new THREE.Vector3();

      var cam_pos = new THREE.Vector3();

      cam_pos.setFromMatrixPosition(_scene.GetCamera().matrixWorld);

      for (poi_id of journey.pois) {
        var poi = pois[poi_id];
        if (!poi) continue;

        poi_position.x = poi.position.x;
        poi_position.z = poi.position.y;
        var position = AMTHREE.WorldToCanvasPosition(poi_position, _scene.GetCamera(), _canvas2d);

        if (position.z < 1) {
          var x = position.x;
          var y = _canvas2d.height - 100;
          var width = 120;
          var height = 58;

          _context2d.fillStyle = "rgba(15, 15, 15, 0.75)";
          DrawBubble(_context2d, x, y, width, height, 10);

          var distance = (cam_pos.distanceTo(poi_position) / 1000).toFixed(2);
          var padding = 6;
          var size_max = width - 2 * padding;
          var line = 0;
          var font_size = 17;

          _context2d.font = font_size + 'px sans-serif';
          _context2d.fillStyle = 'white';
          line = y - height / 2 + font_size + padding;
          _context2d.fillText(poi.name, x - width / 2 + padding, line, size_max);
          line += font_size + padding;
          if (distance >= 1)
            _context2d.fillText(distance + ' km', x - width / 2 + padding, line, size_max);
          else
            _context2d.fillText((distance * 1000) + ' m', x - width / 2 + padding, line, size_max);

        }
      }
    }

    this.Update = function() {

      _orientation_control.Update();

      if (JourneyManagerSvc.GetMode() === JourneyManagerSvc.MODE_POI)
        UpdateTracking();

      _scene.Update();

      _scene.Render();

      _context2d.clearRect(0, 0, _canvas2d.width, _canvas2d.height);
      _context2d.drawImage(_canvas3d, 0, 0);

      if (JourneyManagerSvc.GetMode() !== JourneyManagerSvc.MODE_POI)
        UpdateBubbles();
      
      UpdateDebugger();

      MarkerDetectorSvc.Empty();
    };


  };


})();

angular.module('journey')

.service('JourneySceneSvc', ['$ionicPlatform', 'JourneyManagerSvc', 'DataManagerSvc',
  'MarkerDetectorSvc', 'CameraSvc', 'LoadingSvc', 'objectFactory',
  'CoordinatesConverterSvc', 'Journey',
  JourneySceneSvc]);