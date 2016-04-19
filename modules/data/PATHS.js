/**
* deprecated, removed soon.
* @memberOf angular_module.data
*/


angular.module('data')

.constant('PATHS', (function() {

  var assets = './assets/';

  var paths = {
    JOURNEY: 'journey.json',
    POIS: 'pois.json',
    MARKERS: 'markers.json',
    OBJECTS: 'contents_objects.json',
    CONTENTS: 'contents.json',
    CHANNELS: 'channels.json'
  };

  for (var i in paths) {
    var path = paths[i];
    paths[i] = assets + path;
  }

  paths.assets = assets;

  return paths;

})());