angular.module('utility')

.service('CameraSvc', function() {

  var camera_grabbing = new AM.FrontCamGrabbing();

  this.Start = function() {
    return camera_grabbing.Start();
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

  this.Pause = function(bool) {
    camera_grabbing.Pause(bool);
  };

  this.TogglePause = function() {
    camera_grabbing.TogglePause();
  };

  this.IsPaused = function() {
    camera_grabbing.IsPaused();
  }

});