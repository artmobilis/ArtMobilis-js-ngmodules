angular.module('data')

.factory('DataManagerSvc', ['dataJourneyFactory', 'PATHS', function(dataJourneyFactory, PATHS) {


  function DataManagerSvc() {

    var _data_journey = dataJourneyFactory.Create();
    var _load_promise = Promise.resolve();

    function LoadData(url, type) {
      _load_promise = _load_promise.then(function() {

        return dataJourneyFactory.LoadData(url, type, _data_journey)
        .then(function(data_journey) {
          _data_journey = data_journey;
        });

      });

      return _load_promise;
    }

    function ParseData(json, type) {
      _load_promise = _load_promise.then(function() {

        return dataJourneyFactory.ParseData(json, type, _data_journey)
        .then(function(data_journey) {
          _data_journey = data_journey;
        });

      })

      return _load_promise;
    }

    function Clear() {
      _data_journey = dataJourneyFactory.Create();
    }

    function GetData() {
      return _data_journey;
    }

    function LoadPresets() {
      LoadData(PATHS.JOURNEY, 'journey');
      LoadData(PATHS.POIS, 'poi_array');
      LoadData(PATHS.MARKERS, 'marker_array');
      LoadData(PATHS.CONTENTS, 'content_array');
      LoadData(PATHS.OBJECTS, 'object_array');
      LoadData(PATHS.CHANNELS, 'channel_array');

      return _load_promise;
    }

    function GetLoadPromise() {
      return _load_promise;
    }

    function CleanReferences() {
      var journey = _data_journey.journey;
      var pois = _data_journey.pois;
      var channels = _data_journey.channels;
      var markers = _data_journey.markers;
      var contents = _data_journey.contents;
      var objects = _data_journey.objects;

      for (var i = 0; i < journey.pois.length;) {
        var poi_id = journey.pois[i];
        if (typeof pois[poi_id] === 'undefined')
          journey.pois.splice(i, 1);
        else
          ++i;
      }

      for (poi_id in pois) {
        var poi = pois[poi_id];
        for (var i = 0; i < poi.channels.length;) {
          var channel_id = poi.channels[i].uuid;
          if (typeof channels[channel_id] === 'undefined')
            poi.channels.splice(i, 1);
          else
            ++i;
        }
      }

      for (channel_id in channels) {
        var channel = channels[channel_id];
        if (typeof markers[channel.marker] === 'undefined')
          channel.marker = null;
        for (var i = 0; i < channel.contents.length;) {
          var content_id = channel.contents[i].uuid;
          if (typeof contents[content_id] === 'undefined')
            channel.contents.splice(i, 1);
          else
            ++i;
        }
      }

      for (content_id in contents) {
        var content = contents[content_id];
        if (typeof objects[content.object] === 'undefined')
          content.object = null;
      }
    }

    this.LoadData = LoadData;
    this.ParseData = ParseData;
    this.Clear = Clear;
    this.GetData = GetData;
    this.LoadPresets = LoadPresets;
    this.GetLoadPromise = GetLoadPromise;
    this.CleanReferences = CleanReferences;

  }


  return new DataManagerSvc();


}])