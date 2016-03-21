/**
 * @class dataArrayFactory
 * @memberOf angular_module.dataLoading
 */

angular.module('dataLoading')

.factory('dataArrayFactory', function() {

  function Parse(json, dataFactory) {
    if (!(json instanceof Array))
      return Promise.reject('failed to parse array: not an array');

    return Promise.all(json.map(function(dataFactory) {
      return function(elem) {
        return dataFactory.Parse(elem);
      }
    }(dataFactory)));
  }

  function Load(url, dataFactory) {
    return new Promise(function(dataFactory) {
      return function(resolve, reject) {

        var loader = new AM.JsonLoader();

        loader.Load(url, function() {
          Parse(loader.json, dataFactory).then(resolve, reject);
        }, function() {
          reject('failed to load data array: ' + url);
        });

      }
    }(dataFactory));
  }


  return {
    Parse: Parse,
    Load: Load
  };
})