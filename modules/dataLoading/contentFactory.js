/**
* @class contentFactory
* @memberOf angular_module.dataLoading
*/

angular.module('dataLoading')

.factory('contentFactory', function() {

  /**
   * @typedef {object} Content
   * @property {value} uuid
   * @property {string} name
   * @property {value} object
   */


  function Create(id, name, object) {
    if (typeof id === 'undefined') {
      console.log('failed to create channel: id undefined');
      return;
    }

    var content = {
      uuid: id,
      name: name || 'unnamed channel',
      object: object
    }

    return content;
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
        var result = Create(json.id, json.name, json.object);
        if (result)
          resolve(result);
        else
          reject('failed to create content: id undefined');
      }
      else
        reject('failed to parse content json: not an object');
    });
  }

  return {
    Create: Create,
    Load: Load,
    Parse: Parse
  };


})