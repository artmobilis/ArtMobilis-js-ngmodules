/**
 * @class poiFactory
 * @memberOf angular_module.dataLoading
 */

angular.module('dataLoading')

.factory('poiFactory', ['dataArrayFactory', 'CoordinatesConverterSvc',
  function(dataArrayFactory, CoordinatesConverterSvc) {

  /**
   * @typedef {object} POI
   * @property {value} uuid
   * @property {string} name
   * @property {number} latitude
   * @property {number} longitude
   * @property {number} radius
   * @property {object[]} channels
   * @property {value} channels[].uuid - id of the channel
   * @property {value} channels[].object - optionnal - id of the object used as a landmark
   * @property {number} channels[].longitude
   * @property {number} channels[].latitude
   * @property {number} channels[].altitude
   * @property {number} channels[].scale
   */
  
  function AddChannel(poi, uuid, object, longitude, latitude, altitude, scale) {
    var found = poi.channels.find(function(elem) {
      return elem.uuid === uuid;
    });

    if (!found) {
      var new_chan = {
        uuid: uuid,
        object: object,
        longitude: longitude || 0,
        latitude: latitude || 0,
        altitude: altitude || 0,
        scale: scale || 1
      };
      new_chan.position = CoordinatesConverterSvc.ConvertLocalCoordinates(latitude, longitude);
      poi.channels.push(new_chan);
    }
    return !found;
  }

  function Create(id, name, latitude, longitude, radius, channels) {
    if (typeof id === 'undefined')
      return;

    var poi = {
      uuid: id,
      name: name || 'unnamed poi',
      latitude: latitude || 0,
      longitude: longitude || 0,
      radius: radius || 10,
      channels: []
    }
    poi.position = CoordinatesConverterSvc.ConvertLocalCoordinates(poi.latitude, poi.longitude);

    if (channels) {
      for (var i = 0, c = channels.length; i < c; ++i) {
        var channel = channels[i];
        if (typeof channel.uuid !== 'undefined') {
          AddChannel(poi, channel.uuid, channel.object, channel.longitude,
            channel.latitude, channel.altitude, channel.scale);
        }
        else
          console.warn('failed to add channel to POI: uuid undefined');
      }
    }

    return poi;
  }

  function Load(url) {
    return new Promise(function(resolve, reject) {

      var loader = new AM.JsonLoader();

      loader.load(url, function() {
        Parse(loader.json).then(resolve, reject);
      }, function() {
        reject('failed to load POI: ' + url);
      });

    })
  }

  function Parse(json) {
    return new Promise(function(resolve, reject) {
      if (typeof json === 'object') {
        var result = Create(json.uuid, json.name, json.latitude,
          json.longitude, json.radius, json.channels);
        if (result)
          resolve(result);
        else
          reject('failed to create POI: id undefined');
      }
      else
        reject('failed to parse poi json: not an object');
    });
  }

  var LoadArray = function(url) { return dataArrayFactory.Load(url, Parse); };
  var ParseArray = function(json) { return dataArrayFactory.Parse(json, Parse); };

  return {
    Create: Create,
    Load: Load,
    Parse: Parse,
    LoadArray: LoadArray,
    ParseArray: ParseArray,
    AddChannel: AddChannel
  };


}])