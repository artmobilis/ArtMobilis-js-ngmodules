/**
* @class channelFactory
* @memberOf angular_module.dataLoading
*/

angular.module('dataLoading')

.factory('channelFactory', ['dataArrayFactory', function(dataArrayFactory) {

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
  * @property {string} contents[].name
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

  /**
  * Adds a content to a Channel
  * @memberOf angular_module.dataLoading.channelFactory
  * @param {Channel} channel
  * @param {Content} content
  */
  function AddContent(channel, content) {
    if (content.uuid) {
      var new_content = {
        uuid: content.uuid,
        name: content.name || 'unnamed content',
        position: ClonePoint3D(content.position),
        rotation: ClonePoint3D(content.rotation),
        scale: content.scale || 1
      };

      channel.contents.push(new_content);
    }
    else {
      console.log('failed to add content to channel ' + channel.uuid + ': uuid undefined');
    }
  }

  /**
  * Creates a Channel
  * @memberOf angular_module.dataLoading.channelFactory
  * @param {value} id
  * @param {string} [name='unnamed channel']
  * @param {value} [marker] - id of a Marker
  * @param {Content[]} [contents] - array of Content
  * @returns {Channel}
  */
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
        AddContent(channel, contents[i]);
      }
    }

    return channel;
  }

  /**
  * Loads the json file of a Channel
  * @memberOf angular_module.dataLoading.channelFactory
  * @param {string} url
  * @returns {Promise.<Channel, string>} a promise
  */
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

  /**
  * Parses the json object of a Channel
  * @memberOf angular_module.dataLoading.channelFactory
  * @param {object} json
  * @returns {Promise.<Channel, string>} a promise
  */
  function Parse(json) {
    return new Promise(function(resolve, reject) {
      if (typeof json === 'object') {
        var result = Create(json.uuid, json.name, json.marker, json.contents);
        if (result)
          resolve(result);
        else
          reject('failed to create channel: id undefined');
      }
      else
        reject('failed to parse channel json: not an object');
    });
  }

  /**
  * Loads the json file of an array of Channel
  * @memberOf angular_module.dataLoading.channelFactory
  * @param {string} url
  * @returns {Promise.<Channel[], string>} a promise
  */
  var LoadArray = function(url) { return dataArrayFactory.Load(url, Parse); };

  /**
  * Parses the json object of an array of Channel
  * @memberOf angular_module.dataLoading.channelFactory
  * @param {string} url
  * @returns {Promise.<Channel[], string>} a promise
  */
  var ParseArray = function(json) { return dataArrayFactory.Parse(json, Parse); };

  return {
    Create: Create,
    Load: Load,
    Parse: Parse,
    LoadArray: LoadArray,
    ParseArray: ParseArray,
    AddContent: AddContent
  };


}])