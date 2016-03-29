/**
* @class contentFactory
* @memberOf angular_module.dataLoading
*/

angular.module('dataLoading')

.factory('contentFactory', ['dataArrayFactory', function(dataArrayFactory) {

  /**
   * @typedef {object} Content
   * @property {value} uuid
   * @property {string} name
   * @property {value} object
   */


  /**
  * Creates a Content
  * @memberOf angular_module.dataLoading.contentFactory
  * @param {value} id
  * @param {string} [name='unnamed channel']
  * @param {value} [object] - id of a THREE.Object3D
  * @returns {Content}
  */
  function Create(id, name, object) {
    if (typeof id === 'undefined') {
      console.log('failed to create channel: id undefined');
      return;
    }

    var content = {
      uuid: id,
      name: name || 'unnamed content',
      object: object
    }

    return content;
  }

  /**
  * Loads the json file of a Content
  * @memberOf angular_module.dataLoading.contentFactory
  * @param {string} url
  * @returns {Promise.<Content, string>} a promise
  */
  function Load(url) {
    return new Promise(function(resolve, reject) {

      var loader = new AM.JsonLoader();

      loader.Load(url, function() {
        Parse(loader.json).then(resolve, reject);
      }, function() {
        reject('failed to load content: ' + url);
      });

    });
  }

  /**
  * Parses the json object of a Content
  * @memberOf angular_module.dataLoading.contentFactory
  * @param {object} json
  * @returns {Promise.<Content, string>} a promise
  */
  function Parse(json) {
    return new Promise(function(resolve, reject) {
      if (typeof json === 'object') {
        var result = Create(json.uuid, json.name, json.object);
        if (result)
          resolve(result);
        else
          reject('failed to create content: id undefined');
      }
      else
        reject('failed to parse content json: not an object');
    });
  }

  /**
  * Loads the json file of an array of Content
  * @memberOf angular_module.dataLoading.contentFactory
  * @param {string} url
  * @returns {Promise.<Content[], string>} a promise
  */
  var LoadArray = function(url) { return dataArrayFactory.Load(url, Parse); };
  
  /**
  * Parses the json object of an array of Content
  * @memberOf angular_module.dataLoading.contentFactory
  * @param {string} url
  * @returns {Promise.<Content[], string>} a promise
  */
  var ParseArray = function(json) { return dataArrayFactory.Parse(json, Parse); };

  return {
    Create: Create,
    Load: Load,
    Parse: Parse,
    LoadArray: LoadArray,
    ParseArray: ParseArray
  };


}])