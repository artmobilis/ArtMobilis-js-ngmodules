(function() {


  angular.module('journey')

  .factory('JourneyRenderer', [
    'JourneySceneSvc',
    'CameraSvc',
    'DataManagerSvc',
    'JourneyManagerSvc',
    'MarkerDetectorSvc',
    function(
      JourneySceneSvc,
      CameraSvc,
      DataManagerSvc,
      JourneyManagerSvc,
      MarkerDetectorSvc) {


    /**
    * A class to render the CameraSvc and the JourneySceneSvc to a canvas
    * @class angular_module.journey.JourneyRenderer
    * @memberOf angular_module.journey
    */

    function JourneyRenderer(width, height) {

      var _canvas3d = document.createElement('canvas');
      var _canvas2d = document.createElement('canvas');
      _canvas2d.style.position = 'absolute';
      _canvas2d.style.left = '0px';
      _canvas2d.style.top = '0px';
      _canvas2d.style['background-color'] = 'transparent';
      var _ctx2d = _canvas2d.getContext('2d');

      var _renderer = new THREE.WebGLRenderer( { canvas: _canvas3d, alpha: true } );
      var _camera = new THREE.PerspectiveCamera(60, 1, 0.001, 10000);

      var _camera_width = 0;
      var _camera_height = 0;

      var _camera_video_element = CameraSvc.GetVideoElement();

      var _debug_enabled = false;
      var _debugMatches = false;
      var _marker_corners;
      var _image_debugger = new AM.ImageDebugger();
      _image_debugger.SetData(_ctx2d, CameraSvc.GetVideoElement(), _debugMatches);


      /**
      * Resizes the renderer, the canvas, and the 3D camera.
      * @memberOf angular_module.journey.JourneyRenderer
      * @param {number} width
      * @param {number} height
      */
      function Resize(width, height) {
        width = width || _canvas3d.width;
        height = height || _canvas3d.height;

        _renderer.setSize(width, height);
        _canvas2d.width = width;
        _canvas2d.height = height;
        if (height > 0) {
          _camera.aspect = width / height;
          _camera.updateProjectionMatrix();
        }
      }

      function RenderDebug() {
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
        _marker_corners = marker_corners;
      }

      function OnCamLoaded() {
        _camera_width  = _camera_video_element.videoWidth;
        _camera_height = _camera_video_element.videoHeight;
      }

      function CopyVideo() {
        if (_camera_video_element.readyState === _camera_video_element.HAVE_ENOUGH_DATA) {
          if (_camera_width > 0 && _camera_height > 0) {
            var ratio_x = _canvas2d.width  / _camera_width;
            var ratio_y = _canvas2d.height / _camera_height;
            var ratio   = Math.max(ratio_x, ratio_y);
            var diff_h  = (_canvas2d.width  - _camera_width  * ratio) / 2;
            var diff_v  = (_canvas2d.height - _camera_height * ratio) / 2;
            var new_width  = _camera_width  * ratio;
            var new_height = _camera_height * ratio;

            _ctx2d.drawImage(_camera_video_element, diff_h, diff_v, new_width, new_height);
          }
        }
      }

      /**
      * Renders to the canvas
      * @memberOf angular_module.journey.JourneyRenderer
      */
      function Render() {
        var user_head = JourneySceneSvc.GetUserHead();
        user_head.matrixWorld.decompose(_camera.position, _camera.quaternion, _camera.scale);

        _renderer.render(JourneySceneSvc.GetScene(), _camera);

        _ctx2d.clearRect(0, 0, _canvas2d.width, _canvas2d.height);

        CopyVideo();

        _ctx2d.drawImage(_canvas3d, 0, 0);

        if (JourneyManagerSvc.GetMode() !== JourneyManagerSvc.MODE_POI) {
          RenderBubbles(_canvas2d, _camera);
        }

        if (_debug_enabled)
          RenderDebug();
      }

      /**
      * Sets the 3D camera's fov.
      * @memberOf angular_module.journey.JourneyRenderer
      * @param {number} fov
      */
      function SetFov(fov) {
        _camera.fov = fov;
        _camera.updateProjectionMatrix();
      }

      /**
      * Enables and disables the debug mode.
      * @memberOf angular_module.journey.JourneyRenderer
      * @param {bool}
      */
      function SetDebug(bool) {
        _debug_enabled = bool;
      }

      /**
      * Returns the inner canvas.
      * @memberOf angular_module.journey.JourneyRenderer
      * @returns {Canvas}
      */
      function GetCanvas() {
        return _canvas2d;
      }

      /**
      * Adds event listeners.
      * @memberOf angular_module.journey.JourneyRenderer
      */
      function Start() {
        _camera_video_element.addEventListener('loadedmetadata', OnCamLoaded, false);
        OnCamLoaded();
      }

      /**
      * Removes event listeners.
      * @memberOf angular_module.journey.JourneyRenderer
      */
      function Stop() {
        _camera_video_element.removeEventListener('loadedmetadata', OnCamLoaded, false);
      }

      Resize(width, height);

      this.Render = Render;
      this.Resize = Resize;
      this.SetFov = SetFov;
      this.SetDebug = SetDebug;
      this.GetCanvas = GetCanvas;
      this.Start = Start;
      this.Stop = Stop;

    }


    function RenderBubbles(canvas, camera) {
      var ctx = canvas.getContext('2d');

      var data_journey = DataManagerSvc.GetData();
      var journey = data_journey.journey;
      var pois = data_journey.pois;

      var poi_position = new THREE.Vector3();

      var cam_pos = new THREE.Vector3();

      cam_pos.setFromMatrixPosition(camera.matrixWorld);

      for (var poi_id of journey.pois) {
        var poi = pois[poi_id];
        if (!poi) continue;

        poi_position.x = poi.position.x;
        poi_position.y = 0;
        poi_position.z = poi.position.y;
        var position = AMTHREE.WorldToCanvasPosition(poi_position, camera, canvas);

        if (position.z < 1) {
          var x = position.x;
          var y = canvas.height - 100;
          var width = 120;
          var height = 58;

          ctx.fillStyle = 'rgba(15, 15, 15, 0.75)';
          DrawBubble(ctx, x, y, width, height, 10);

          var distance = (cam_pos.distanceTo(poi_position) / 1000).toFixed(2);
          var padding = 6;
          var size_max = width - 2 * padding;
          var line = 0;
          var font_size = 17;

          ctx.font = font_size + 'px sans-serif';
          ctx.fillStyle = 'white';
          line = y - height / 2 + font_size + padding;
          ctx.fillText(poi.name, x - width / 2 + padding, line, size_max);
          line += font_size + padding;
          if (distance >= 1)
            ctx.fillText(distance + ' km', x - width / 2 + padding, line, size_max);
          else
            ctx.fillText((distance * 1000) + ' m', x - width / 2 + padding, line, size_max);

        }
      }
    }


    return JourneyRenderer;

  }]);


  function DrawBubble(ctx, x, y, width, height, radius) {
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


})();