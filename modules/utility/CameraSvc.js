angular.module('utility')

.service('CameraSvc', function() {

  var camera_grabbing = new AM.FrontCamGrabbing();

  this.Start = function(on_loading_end, on_error) {
    camera_grabbing.Start().then(on_loading_end, function(e) {
      on_error(e);
      on_loading_end();
    });
  };

  this.Stop = function() {
    camera_grabbing.Stop();
  };

  this.IsActive = function() {
    return camera_grabbing.IsActive();
  };

  this.GetVideoElement = function() {
    return camera_grabbing.domElement;
  };

});