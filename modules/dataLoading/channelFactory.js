/**
* @class channelFactory
* @memberOf angular_module.dataLoading
*/

angular.module('dataLoading')

.factory('channelFactory', function() {

  /**
   * @typedef {object} Point3D
   * @property {number} x
   * @property {number} y
   * @property {number} z
   */

  /**
   * @typedef {object} Channel
   * @property {value} uuid
   * @property {string} name
   * @property {value} marker
   * @property {object[]} contents
   * @property {value} contents[].uuid
   * @property {Point3D} contents[].position
   * @property {Point3D} contents[].rotation
   * @property {number} contents[].scale
   */

 
  function ClonePoint3D(point) {
    point = point || {};
    return {
      x: point.x || 0,
      y: point.y || 0,
      z: point.z || 0
    };
  }

  function Create(id, name, marker, contents) {
    if (typeof id === 'undefined')
      return;

    var channel = {
      uuid: id,
      name: name || 'unnamed channel',
      marker: marker,
      contents: []
    }

    if (contents) {
      for (var i = 0, c = contents.length; i < c; ++i) {
        var c = contents[i];

        if (content.uuid) {
          var content = {
            uuid: c.uuid,
            name: c.name || 'unnamed channel',
            position: ClonePoint3D(c.position),
            rotation: ClonePoint3D(c.rotation),
            scale: c.scale || 1
          };

          journey.contents.push(content);
        }
        else
          console.log('failed to add content to channel ' + channel.uuid + ': uuid undefined');
      }
    }

    return channel;
  }

  function Load(url) {
    return new Promise(function(resolve, reject) {

      var loader = new AM.JsonLoader();

      loader.Load(url, function() {
        Parse(loader.json).then(resolve, reject);
      }, function() {
        reject('failed to load channel: ' + url);
      });

    });
  }

  function Parse(json) {
    return new Promise(function(resolve, reject) {
      if (typeof json === 'object') {
        var result = Create(json.id, json.name, json.marker, json.contents);
        if (result)
          resolve(result);
        else
          reject('failed to create channel: id undefined');
      }
      else
        reject('failed to parse channel json: not an object');
    });
  }

  return {
    Create: Create,
    Load: Load,
    Parse: Parse
  };


})