/**
* A singleton service that computes the current state of the journey
* @class angular_module.journey.JourneyManagerSvc
* @memberOf angular_module.journey
*/

angular.module('journey')

.service('JourneyManagerSvc', ['CoordinatesConverterSvc', 'GeolocationSvc', 'DataManagerSvc',
  function(CoordinatesConverterSvc, GeolocationSvc, DataManagerSvc) {
  var that = this;

  this.MODE_NAVIGATION = 0;
  this.MODE_POI = 1;
  this.MODE_NAVIGATION_FORCED = 2;

  var _position = { x: 0, y: 0 };

  var _current_poi;
  var _mode = this.MODE_NAVIGATION;

  var _running = false;

  function DispatchEventModeChange() {
    var event = new Event('journey_mode_change');
    document.dispatchEvent(event);
  }

  function IsEnteringPOI(poi) {
    var d_max = poi.radius * poi.radius;
    var poi_pos = poi.position;
    var dx = poi_pos.x - _position.x;
    var dy = poi_pos.y - _position.y;
    var d = dx * dx + dy * dy;
    return (d < d_max);
  }

  function IsLeavingPOI(poi) {
    var coef = 1.2;

    var radius = poi.radius * coef;
    var d_max = radius * radius;
    var poi_pos = poi.position;
    var dx = poi_pos.x - _position.x;
    var dy = poi_pos.y - _position.y;
    var d = dx * dx + dy * dy;
    return (d > d_max);
  }

  function FindEnteringPOI(journey, pois) {
    for (var i = 0, c = journey.pois.length; i < c; ++i) {
      var poi_id = journey.pois[i];
      var poi = pois[poi_id];
      if (!poi) continue;

      if (IsEnteringPOI(poi)) {
        return poi;
      }
    }
    return undefined;
  }

  function GoToPOI(poi) {
    _mode = that.MODE_POI;
    _current_poi = poi;
    DispatchEventModeChange();
  }

  function GoToNavigation() {
    _mode = that.MODE_NAVIGATION;
    _current_poi = undefined;
    DispatchEventModeChange();
  }

  function GoToNavigationForced() {
    _mode = that.MODE_NAVIGATION_FORCED;
    DispatchEventModeChange();
  }

  function SetMode() {
    var data_journey = DataManagerSvc.GetData();
    var pois = data_journey.pois;
    var journey = data_journey.journey;

    switch (_mode) {

      case that.MODE_NAVIGATION:
      var poi = FindEnteringPOI(journey, pois);
      if (poi)
        GoToPOI(poi);
      break;

      case that.MODE_POI:
      if (IsLeavingPOI(_current_poi))
        GoToNavigation();
      break;

      case that.MODE_NAVIGATION_FORCED:
      if (IsLeavingPOI(_current_poi))
        GoToNavigation();
      break;
    }
  }

  function OnDeviceMove(event) {
    _position.x = event.detail.x;
    _position.y = event.detail.y;
    SetMode();
  }

  function OnDataChange() {
    that.SetPoisPosition(DataManagerSvc.GetData().pois);
    GoToNavigation();
  }

  /**
  * Resets the service.
  * @memberOf angular_module.journey.JourneyManagerSvc
  */
  function Reset() {
    GoToNavigation();
  }

  /**
  * Computes the position of pois
  * @memberOf angular_module.journey.JourneyManagerSvc
  * @param {POI[]} pois
  */
  function SetPoisPosition(pois) {
    for (var key in pois) {
      var poi = pois[key];
      poi.position = CoordinatesConverterSvc.ConvertLocalCoordinates(poi.latitude, poi.longitude);
    }
  }

  /**
  * Returns the current state of the journey
  * @memberOf angular_module.journey.JourneyManagerSvc
  * @returns {JourneyManagerSvc.MODE_NAVIGATION | JourneyManagerSvc.MODE_POI | JourneyManagerSvc.MODE_NAVIGATION_FORCED}
  */
  function GetMode() {
    return _mode;
  }

  /**
  * Returns the current POI if mode is MODE_POI, undefined otherwise.
  * @memberOf angular_module.journey.JourneyManagerSvc
  * @return {POI|undefined}
  */
  function GetCurrentPOI() {
    if (_mode === that.MODE_POI || _mode === that.MODE_TRACKING) {
      return _current_poi;
    }
    return undefined;
  }

  /**
  * Starts the geolocation service, add listeners, resets this.
  * @memberOf angular_module.journey.JourneyManagerSvc
  */
  function Start() {
    if (!_running) {
      _running = true;
      SetPoisPosition(DataManagerSvc.GetData().pois);
      document.addEventListener('device_move_xy', OnDeviceMove, false);
      DataManagerSvc.AddListenerDataChange(OnDataChange);
      _mode = that.MODE_NAVIGATION;
      GeolocationSvc.Start();
      DispatchEventModeChange();
    }
  }

  /**
  * Removes the listeners, stops this, and the geolocation service.
  * @memberOf angular_module.journey.JourneyManagerSvc
  */
  function Stop() {
    if (_running) {
      Reset();
      GeolocationSvc.Stop();
      DataManagerSvc.RemoveListenerDataChange(OnDataChange);
      document.removeEventListener('device_move_xy', OnDeviceMove, false);
      _running = false;
    }
  }

  /**
  * Returns true if the service is currently enabled.
  * @memberOf angular_module.journey.JourneyManagerSvc
  * @return {bool}
  */
  function Running() {
    return _running;
  }

  /**
  * Enable or disable the mode JourneyManagerSvc.MODE_NAVIGATION_FORCED.
  * @memberOf angular_module.journey.JourneyManagerSvc
  * @param {bool} force_navigation
  */
  function ForceNavigationMode(force_navigation) {
    if (!force_navigation) {
      if (_current_poi)
        GoToPOI(_current_poi);
      else
        GoToNavigation();
    }
    else {
      if (_mode == that.MODE_POI)
        GoToNavigationForced();
    }
  }

  this.Reset = Reset;
  this.SetPoisPosition = SetPoisPosition;
  this.GetMode = GetMode;
  this.GetCurrentPOI = GetCurrentPOI;
  this.Start = Start;
  this.Stop = Stop;
  this.Running = Running;
  this.ForceNavigationMode = ForceNavigationMode;

  
}]);