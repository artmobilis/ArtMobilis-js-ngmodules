/**
* A singleton service that stores and manages the assets of the journey.
* @class DataManagerSvc
* @memberOf angular_module.data
*/

angular.module('data')

.factory('DataManagerSvc', ['journeyType', function(journeyType) {

  /*
  * A string, id of an asset type
  * @typedef {('data_journey'|'journey'|'poi'|'channel'|'marker'|'content'|'object')} AssetType
  */

  /*
  * A string, id of a data type
  * @typedef {('data_journey'|'journey'|'poi'|'poi_array'|'channel'|'channel_array'|'marker'|'marker_array'|'content'|'content_array'|'object'|'object_array')} DataType
  */


  function DataManagerSvc() {

    var _data_journey = new journeyType.DataJourney();
    var _load_promise = Promise.resolve();
    var _event_manager = new AM.EventManager();
    var _data_change_event_name = 'data_changed';


    /**
    * Adds a listener to the event of a data change.
    * @memberOf angular_module.data.DataManagerSvc
    * @param {function} fun
    */
    function AddListenerDataChange(fun) {
      return _event_manager.AddListener(_data_change_event_name, fun);
    }

    /**
    * Removes a listener to the event of a data change.
    * @memberOf angular_module.data.DataManagerSvc
    * @param {function} fun
    */
    function RemoveListenerDataChange(fun) {
      return _event_manager.RemoveListener(_data_change_event_name, fun);
    }

    /**
    * Fires an event of a data change.
    * @memberOf angular_module.data.DataManagerSvc
    * @param {AssetType} [type] - 
    * @param {string} [id] - If necessary, the id of the asset.
    */
    function NotifyChange(type, id) {
      return _event_manager.Fire(_data_change_event_name, [type, id]);
    }

    function ParseDataDoIt(json, type) {
      var promise;

      switch (type) {
        case 'data_journey':
          promise = _data_journey.FromJson(json).then(function() {
            NotifyChange('data_journey');
          });
        break;
        default:
          promise = Promise.resolve();
        break;
      }

      return promise;
    }

    /**
    * Loads a data file
    * @memberOf angular_module.data.DataManagerSvc
    * @param {string} url
    * @param {DataType} type
    * @returns {Promise.<undefined, string>}
    */
    function LoadData(url, type) {
      _load_promise = _load_promise.then(function() {
        return AM.LoadJson(url).then(function(json) {
          return ParseDataDoIt(json, type);
        });
      });

      return _load_promise;
    }

    /**
    * Parses a data json
    * @memberOf angular_module.data.DataManagerSvc
    * @param {object} json
    * @param {DataType} type
    * @returns {Promise.<undefined, string>}
    */
    function ParseData(json, type) {
      _load_promise = ParseDataDoIt(json, type);
      return _load_promise;
    }

    /**
    * Resets the data.
    * @memberOf angular_module.data.DataManagerSvc
    */
    function Clear() {
      _data_journey = new journeyType.DataJourney();
      NotifyChange('data_journey');
    }

    /**
    * Returns the data.
    * @memberOf angular_module.data.DataManagerSvc
    * @returns {DataJourney}
    */
    function GetData() {
      return _data_journey;
    }

    function GetLoadPromise() {
      return _load_promise;
    }

    /**
    * Removes references of objects no longer existing. Call this after removing an asset.
    * @memberOf angular_module.data.DataManagerSvc
    */
    function CleanReferences() {
      var journey = _data_journey.journey;
      var pois = _data_journey.pois;
      var channels = _data_journey.channels;
      var markers = _data_journey.markers;
      var objects = _data_journey.objects;

      var poi_id, i, channel_id, content_id;

      for (i = 0; i < journey.pois.length;) {
        poi_id = journey.pois[i];
        if (typeof pois[poi_id] === 'undefined') {
          journey.pois.splice(i, 1);
          NotifyChange('journey');
        }
        else
          ++i;
      }

      for (poi_id in pois) {
        var poi = pois[poi_id];
        for (i = 0; i < poi.channels.length;) {
          channel_id = poi.channels[i].uuid;
          if (typeof channels[channel_id] === 'undefined') {
            poi.channels.splice(i, 1);
            NotifyChange('poi', poi_id);
          }
          else
            ++i;
        }
      }

      for (channel_id in channels) {
        var channel = channels[channel_id];
        var changed = false;
        if (typeof markers[channel.marker] === 'undefined') {
          channel.marker = null;
          changed = true;
        }
        for (i = 0; i < channel.contents.length;) {
          object_id = channel.contents[i].uuid;
          if (typeof objects[object_id] === 'undefined') {
            channel.contents.splice(i, 1);
            changed = true;
          }
          else
            ++i;
        }
        if (changed)
          NotifyChange('channel', channel_id);
      }
    }

    this.LoadData = LoadData;
    this.ParseData = ParseData;
    this.Clear = Clear;
    this.GetData = GetData;
    this.GetLoadPromise = GetLoadPromise;
    this.CleanReferences = CleanReferences;
    this.AddListenerDataChange = AddListenerDataChange;
    this.RemoveListenerDataChange = RemoveListenerDataChange;
    this.NotifyChange = NotifyChange;

  }


  return new DataManagerSvc();


}]);