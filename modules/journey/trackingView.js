/**
* @class angular_module.journey.GeolocationSvc
* @memberOf angular_module.journey
*/

angular.module('journey')

.directive('trackingView', ['CameraSvc', 'JourneySceneSvc', 'JourneyRenderer',
  function(CameraSvc, JourneySceneSvc, JourneyRenderer) {
    return {
      restrict: 'E',
      template: '<div/>',
      link: function(scope, element, attr) {

        var that = this;

        var _element = element[0];
        var _div = element.children[0];

        var _camera_video_element = CameraSvc.GetVideoElement();
        var _camera_video_element_appended = false;
        var _scene;

        var _journey_renderer = new JourneyRenderer();

        var _canvas = _journey_renderer.GetCanvas();
        var _canvas_appended = false;

        var _device_lock_screen = new AM.DeviceLockScreenOrientation();

        var _running = false;
        var _destroyed = false;


        function OnWindowResize() {
          _journey_renderer.Resize(window.innerWidth, window.innerHeight);
        }

        attr.$observe('run', function(run) {
          if (run === 'true' && !_running) {
            _running = true;
            _journey_renderer.Start();
            Loop();
          }
        });

        _device_lock_screen.LockPortrait();


        _element.appendChild(_canvas);
        _canvas_appended = true;

        window.addEventListener('resize', OnWindowResize);
        OnWindowResize();


        scope.$on('$destroy', function() {
          _running = false;
          _destroyed = true;
          _journey_renderer.Stop();
          window.removeEventListener('resize', OnWindowResize);
          if (_camera_video_element_appended) {
            document.body.removeChild(_camera_video_element);
            _camera_video_element_appended = false;
          }
          if (_canvas_appended) {
            _element.removeChild(_canvas);
            _canvas_appended = false;
          }
          _device_lock_screen.Unlock();
        });


        function Loop() {
          if (_running && !_destroyed) {
            window.requestAnimationFrame(Loop);
            if (JourneySceneSvc.Started()) {
              JourneySceneSvc.Update();
              _journey_renderer.Render();
            }
          }
        }

      }
    };
  }
]);