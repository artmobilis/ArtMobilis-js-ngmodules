/**
 * @class dataJourneyFactory
 * @memberOf angular_module.dataLoading
 */

angular.module('dataLoading')

.factory('dataJourneyFactory', ['markerFactory', 'contentFactory',
  'channelFactory', 'poiFactory', 'journeyFactory', 'dataArrayFactory',
  function(markerFactory, contentFactory, channelFactory,
    poiFactory, journeyFactory, dataArrayFactory) {


  /**
   * @typedef {object} DataJourney
   * @property {Journey} journey
   * @property {POI[]} pois
   * @property {Channel[]} channels
   * @property {Marker[]} markers
   * @property {Content[]} contents
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

  function Parse(json) {
    return new Promise(function(resolve, reject) {
      if (typeof json === 'object') {


        var data_journey = {};

        var promises = [];
        promises.push(journeyFactory.Parse(json.journey).then(function(journey) {
          data_journey.journey = journey;
        }));
        promises.push(dataArrayFactory.Parse(json.pois, poiFactory).then(function(pois) {
          data_journey.pois = pois;
        }));
        promises.push(dataArrayFactory.Parse(json.channels, channelFactory).then(function(channels) {
          data_journey.channels = channels;
        }));
        promises.push(dataArrayFactory.Parse(json.markers, markerFactory).then(function(markers) {
          data_journey.markers = markers;
        }));
        promises.push(dataArrayFactory.Parse(json.contents, contentFactory).then(function(contents) {
          data_journey.contents = contents;
        }));

        Promise.all(promises).then(function() {
          resolve(data_journey);
        }, reject);
      }
      else
        reject('failed to parse DataJourney json: not an object');
    });
  }

  return {
    Load: Load,
    Parse: Parse
  };


}])