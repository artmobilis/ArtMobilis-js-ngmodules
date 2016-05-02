/**
* @class angular_module.journey.trackingView
* @memberOf angular_module.journey
*/

angular.module('journey')

.directive('trackingView', ['JourneySceneSvc', 'JourneyRenderer',
  function(JourneySceneSvc, JourneyRenderer) {
    return {
      restrict: 'E',
      link: function(scope, element, attr) {

        var that = this;

        var _element = element[0];

        var _scene;

        var _journey_renderer = new JourneyRenderer();
        _journey_renderer.SetFov(80);

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