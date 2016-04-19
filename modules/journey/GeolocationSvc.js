/**
* A singleton service that retrieves gps position and converts it to flat coordinates.
* @class angular_module.journey.GeolocationSvc
* @memberOf angular_module.journey
*/

angular.module('journey')

.service('GeolocationSvc', function(CoordinatesConverterSvc) {

  var _position = { x: 0, y: 0 };
  var _converter;
  var _watch_id;
  var _watching = false;

  var _retry_rate_ms = 1000;
  var _retry_max = 10;
  var _retry_nbr = 0;

  var _loading = false;

  var _on_watch;
  var _on_error;


  function OnNewPosition() {
    var event = new CustomEvent('device_move_xy', { detail: { x: _position.x, y: _position.y } });
    document.dispatchEvent(event);
  }

  function SetCoords(latitude, longitude) {
    _position = CoordinatesConverterSvc.ConvertLocalCoordinates(latitude, longitude);
    OnNewPosition();
  }

  function OnSuccess(pos) {
    _retry_nbr = 0;
    _watching = true;
    _loading = false;
    if (_on_watch) {
      _on_watch();
      _on_watch = undefined;
    }
    SetCoords(pos.coords.latitude, pos.coords.longitude);
  }

  function OnError(e) {
    console.log('Geolocation error: ' + e.message);
    if (_retry_nbr < _retry_max) {
      ++_retry_nbr;
      window.setTimeout(WatchPosition, _retry_rate_ms);
    }
    else {
      _watching = false;
      _loading = false;
      if (_on_error)
        _on_error(e.message);
    }
  }

  function WatchPosition() {
    _watch_id = navigator.geolocation.watchPosition(OnSuccess, OnError);
  }


  /**
  * Adds the listener.
  * @memberOf angular_module.journey.GeolocationSvc
  * @param {function} on_watch
  * @param {function} on_error
  */
  function Start(on_watch, on_error) {
    if (!_watching && !_loading) {
      _on_watch = on_watch;
      _on_error = on_error;
      if (navigator && navigator.geolocation) {
        _loading = true;
        _retry_nbr = 0;
        WatchPosition();
      }
      else {
        if (_on_error)
          _on_error('geolocation unavailable');
      }
    }
  }

  /**
  * Removes the listener.
  * @memberOf angular_module.journey.GeolocationSvc
  */
  function Stop() {
    if (_watching) {
      navigator.geolocation.clearWatch(_watch_id);
      _watching = false;
    }
  }

  /**
  * Returns the gps coordinates converted to flat coordinates.
  * @memberOf angular_module.journey.GeolocationSvc
  * @returns {Object.<x, y>}
  */
  function GetPosition() {
    return { x: _position.x, y: _position.y };
  }

  /**
  * Returns true if the geolocation is loading.
  * @memberOf angular_module.journey.GeolocationSvc
  * @returns {bool}
  */
  function IsLoading() {
    return _loading;
  }

  /**
  * Returns true if the geolocation has started.
  * @memberOf angular_module.journey.GeolocationSvc
  * @returns {bool}
  */
  function IsWatching() {
    return _watching;
  }

  /**
  * Sets the internal coordinates and fires the 'device_move_xy' event
  * @memberOf angular_module.journey.GeolocationSvc
  * @param {number} latitude - in degrees
  * @param {number} longitude - in degrees
  */
  function SimulateNewCoords(latitude, longitude) {
    SetCoords(latitude, longitude);
  }

  /**
  * Sets the internal coordinates and fires the 'device_move_xy' event
  * @memberOf angular_module.journey.GeolocationSvc
  * @param {number} x
  * @param {number} y
  */
  function SimulateNewPosition(x, y) {
    _position.x = x;
    _position.y = y;
    OnNewPosition();
  }

  this.Start = Start;
  this.Stop = Stop;
  this.GetPosition = GetPosition;
  this.IsLoading = IsLoading;
  this.IsWatching = IsWatching;
  this.SimulateNewCoords = SimulateNewCoords;
  this.SimulateNewPosition = SimulateNewPosition;

});