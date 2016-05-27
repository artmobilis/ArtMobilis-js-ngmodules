(function() {

  var WORKER_SCRIPT_PATH = 'lib/ArtMobilis-js-ngmodules/modules/tracking/MarkerDetectorWorker.js';

  function GetVideoNewSize(width, height, target_size) {
    var ratio_w = target_size / width;
    var ratio_h = target_size / height;

    var ratio = Math.min(Math.max(ratio_w, ratio_h), 1);
    return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
  }


  function MarkerDetectorSvc() {
    var that = this;

    var _worker;
    var _marker_detector;
    var _use_web_worker;
    var _debug=false;

    var _canvas = document.createElement('canvas');
    var _ctx = _canvas.getContext('2d');
    var _image = new Image();
    var _marker;
    var _tags = [];
    var _video;

    var _frame = 0;
    var _frame_worker = 0;

    var _on_added_callbacks = {};

    var _enabled = true;
    var _started = false;

    var _use_fixed_angle = false;


    this.video_size_target = 300;

    this.position = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.quaternion = new THREE.Quaternion();
    this.scale = new THREE.Vector3();

    this.Start = function(video_element, use_web_worker) {
      if (typeof use_web_worker !== 'boolean')
        use_web_worker = true;

      if (!_started) {
        _started = true;
        _video = video_element;
        _use_web_worker = use_web_worker;
        if (use_web_worker) {
          _frame = 0;
          _frame_worker = 0;

          _worker = new Worker(WORKER_SCRIPT_PATH);
          _worker.onmessage = function(e) {

            switch (e.data.cmd) {

              case 'markers':
              _marker = e.data.marker;
              _tags = e.data.tags; 
              _frame_worker = e.data.frame;
              break;

              case 'marker_added':
              var callback = _on_added_callbacks[e.data.uuid];
              if (callback) {
                delete _on_added_callbacks[e.data.uuid];
                callback();
              }
              break;
            }
          };
        }
        else {
          _marker_detector = new MarkerDetector();
        }

        SetUseFixedAngle();
      }

      // _worker.postMessage( { cmd: 'enable_tag_detection', value: false } );
    };

    this.Update = function(fixed_angle) {
      var image;

      if (!_enabled)
        return;

      if (_video instanceof HTMLVideoElement && _video.readyState === _video.HAVE_ENOUGH_DATA) {

        var new_size = GetVideoNewSize(_video.videoWidth, _video.videoHeight, that.video_size_target);
        _canvas.width = new_size.width;
        _canvas.height = new_size.height;
        _ctx.drawImage(_video, 0, 0, _canvas.width, _canvas.height);

        if (_use_web_worker) {
          if (_worker && _frame - _frame_worker < 1) {
            ++_frame;

            image = _ctx.getImageData(0, 0, _canvas.width, _canvas.height);

            var obj_data = {
              cmd: 'new_img',
              image: image,
              frame: _frame,
              debug: _debug,
              angle: fixed_angle
            };
            _worker.postMessage(obj_data, [image.data.buffer]);
            obj_data = null;
          }
        }
        else {
          image = _ctx.getImageData(0, 0, _canvas.width, _canvas.height);
          _marker_detector.SetDebug(_debug);
          var result = _marker_detector.ComputeImage(image, fixed_angle);
          _marker = result.marker;
          _tags = result.tags;
        }


      }

      image = null;
    };

    this.Stop = function() {
      if (_worker) {
        _worker.terminate();
        _worker = null;
        _video = null;
        _marker_detector = null;
      }
      _started = false;
    };

    this.Started = function() {
      return _started;
    };

    this.GetMarker = function() {
      return _marker;
    };

    this.GetTags = function() {
      return _tags;
    };

    this.Empty = function() {
      _marker = undefined;
      _tags.length = 0;
    };

    this.SetTransform = function(marker, model_size) {
      model_size = model_size || 1;

      var corners = [];
      for (var i = 0; i < marker.corners.length; ++i) {
        corners.push( {
          x: marker.corners[i].x - (_canvas.width / 2),
          y: (_canvas.height / 2) - marker.corners[i].y,
        } );
      }

      var posit = new POS.Posit(model_size, _canvas.width);
      var pose = posit.pose(corners);

      if (pose === null) return;


      var rot = pose.bestRotation;
      var translation = pose.bestTranslation;

      that.scale.x = model_size;
      that.scale.y = model_size;
      that.scale.z = model_size;

      that.rotation.x = -Math.asin(-rot[1][2]) || 0;
      that.rotation.y = -Math.atan2(rot[0][2], rot[2][2]) || 0;
      that.rotation.z = Math.atan2(rot[1][0], rot[1][1]) || 0;

      that.position.x = translation[0] || 0;
      that.position.y = translation[1] || 0;
      that.position.z = -translation[2] || 0;

      that.quaternion.setFromEuler(that.rotation);
    };

    this.AddMarker = function(url, uuid, on_end) {
      if (_started) {


        if (_on_added_callbacks[uuid]) {
          if (on_end)
            on_end();
          return;
        }

        _on_added_callbacks[uuid] = on_end;

        AM.LoadImage(url).then(function(url, uuid) {
          return function(image) {
            if (!_started)
              return;

            var image_data = AM.ImageToImageData(image, true);

            if (_use_web_worker) {
              var msg = {
                cmd: 'add_marker',
                image_data: image_data,
                uuid: uuid,
                name: url
              };
              _worker.postMessage(msg, [msg.image_data.data.buffer]);
            }
            else {
              _marker_detector.AddMarker(image_data, uuid);
            }

          };
        }(url, uuid));


      } else
      if (on_end) on_end();
    };

    this.ClearMarkers = function() {
      if (_started) {
        if (_use_web_worker)
          _worker.postMessage( { cmd: 'clear' } );
        else
          _marker_detector.Clear();
      }
    };

    this.ActiveMarker = function(uuid, bool) {
      if (_started) {
        if (_use_web_worker)
          _worker.postMessage( { cmd: 'active', uuid: uuid, value: (bool === true) } );
        else
          _marker_detector.Active(uuid, bool);
      }
    };

    this.ActiveAllMarkers = function(bool) {
      if (_started) {
        if (_use_web_worker)
          _worker.postMessage( { cmd: 'active_all', value: (bool === true) } );
        else
          _marker_detector.ActiveAll(bool);
      }
    };

    this.SetDebug = function(bool){
      _debug=bool;
    };

    function SetUseFixedAngle() {
      if (_started) {
        if (_worker) {
          _worker.postMessage( {
            cmd: 'use_fixed_angle',
            value: _use_fixed_angle
          } );
        }
        else if (_marker_detector) {
          _marker_detector.UseFixedAngle(_use_fixed_angle);
        }
      }
    }

    this.UseFixedAngle = function(bool) {
      if (typeof bool === 'boolean' && bool !== _use_fixed_angle) {
        _use_fixed_angle = bool;
        SetUseFixedAngle();
      }
    };

  }


  angular.module('tracking')
  .service('MarkerDetectorSvc', MarkerDetectorSvc);


})();
