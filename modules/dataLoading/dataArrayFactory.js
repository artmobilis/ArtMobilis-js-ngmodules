/**
 * @class dataArrayFactory
 * @memberOf angular_module.dataLoading
 */
//

angular.module('dataLoading')

.factory('dataArrayFactory', function() {

  /**
  * @callback ParseCallback
  * @param {object} json
  * @returns {Promise.<value, string>}
  */

  /**
  * Parses a json object of an array
  * @memberOf angular_module.dataLoading.dataArrayFactory
  * @param {object} json
  * @param {ParseCallback} parse - 'parse' is called on every element of the parsed array.
  * @returns {Promise.<value[], string>} a promise that resolves when every parse promise resolves, and rejects if one rejects.
  */
  function Parse(json, parse) {
    if (!(json instanceof Array))
      return Promise.reject('failed to parse array: not an array');

    return Promise.all(json.map(function(elem) {
      return parse(elem);
    }));
  }

  /**
  * Loads a json object of an array
  * @memberOf angular_module.dataLoading.dataArrayFactory
  * @param {object} json
  * @param {ParseCallback} parse - 'parse' is called on every element of the parsed array.
  * @returns {Promise.<value[], string>} a promise that resolves when every parse promise resolves, and rejects if one rejects.
  */
  function Load(url, parse) {
    return new Promise(function(resolve, reject) {

      var loader = new AM.JsonLoader();

      loader.Load(url, function() {
        Parse(loader.json, parse).then(resolve, reject);
      }, function() {
        reject('failed to load data array: ' + url);
      });

    });
  }


  return {
    Parse: Parse,
    Load: Load
  };
})