angular.module('utility')

.service('CameraSvc', function() {

  var _camera_grabbing = new AM.FrontCamGrabbing();

  this.Start = function() {
    return _camera_grabbing.Start();
  };

  this.Stop = function() {
    _camera_grabbing.Stop();
  };

  this.IsActive = function() {
    return _camera_grabbing.IsActive();
  };

  this.GetVideoElement = function() {
    return _camera_grabbing.domElement;
  };

  this.Pause = function(bool) {
    _camera_grabbing.Pause(bool);
  };

  this.TogglePause = function() {
    _camera_grabbing.TogglePause();
  };

  this.IsPaused = function() {
    _camera_grabbing.IsPaused();
  }

});