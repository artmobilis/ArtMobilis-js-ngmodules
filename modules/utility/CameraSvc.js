angular.module('utility')

.service('CameraSvc', function() {


  var _video_element = document.createElement('video');
  var _camera_grabbing = new AM.FrontCamGrabbing(_video_element);
  var _use_video = false;
  var _url = '';
  var _started = false;
  var _paused = false;

  _video_element.loop = true;


  function Start() {
    _started = true;
    if (_use_video) {
      _video_element.src = _url;
      _video_element.play();
      return Promise.resolve();
    }
    else
      return _camera_grabbing.Start();
  }

  function Stop() {
    _started = false;
    _video_element.src = '';
    _camera_grabbing.Stop();
  }

  function IsActive() {
    return _started;
  }

  function GetVideoElement() {
    return _camera_grabbing.domElement;
  }

  function Pause(bool) {
    if (_use_video) {
      if (bool)
        _video_element.pause();
      else
        _video_element.play();
      _paused = bool;
    }
    else {
      _camera_grabbing.Pause(bool);
      _paused = _camera_grabbing.IsPaused();
    }
  }

  function TogglePause() {
    Pause(!_paused);
  }

  function IsPaused() {
    return _paused;
  }

  function SetVideo(url) {
    _use_video = true;
    _url = url;
    if (IsActive()) {
      Stop();
      Start();
    }
  }

  function Reset() {
    if (_use_video) {
      _use_video = false;
      _url = '';
      if (IsActive()) {
        Stop();
        Start();
      }
    }
  }


  this.Start = Start;
  this.Stop = Stop;
  this.IsActive = IsActive;
  this.GetVideoElement = GetVideoElement;
  this.Pause = Pause;
  this.TogglePause = TogglePause;
  this.IsPaused = IsPaused;
  this.SetVideo = SetVideo;
  this.Reset = Reset;

});