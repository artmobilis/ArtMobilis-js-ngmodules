/**
 * @class poiFactory
 * @memberOf angular_module.dataLoading
 */

angular.module('dataLoading')

.factory('poiFactory', function() {

  /**
   * @typedef {object} POI
   * @property {value} uuid
   * @property {string} name
   * @property {number} latitude
   * @property {number} longitude
   * @property {number} radius
   * @property {object[]} channels
   * @property {value} channels[].uuid
   * @property {value} channels[].object
   * @property {number} channels[].longitude
   * @property {number} channels[].latitude
   * @property {number} channels[].altitude
   * @property {number} channels[].scale
   */
  

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

    if (channels) {
      for (var i = 0, c = channels.length; i < c; ++i) {
        var channel = channels[i];
        if (typeof channel.uuid !== 'undefined') {
          poi.channels.push({
            uuid: channel.uuid,
            object: channel.object,
            longitude: channel.longitude || 0,
            latitude: channel.latitude || 0,
            altitude: channel.altitude || 0,
            scale: channel.scale || 1
          });
        }
        else
          console.log('failed to add channel to POI: uuid undefined');
      }
    }

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

  return {
    Create: Create,
    Load: Load,
    Parse: Parse
  };


})