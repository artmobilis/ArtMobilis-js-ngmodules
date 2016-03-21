angular.module('data')

.service('ConstantSvc', function() {

  var _constants = {
    path_assets: './assets/',
    path_journey: 'journey.json',
    path_markers: 'markers.json',
    path_objects: 'contents_objects.json',
    path_contents: 'contents.json',
    path_channels: 'channels.json'
  };

  function ConcatPath(url) {
    if (_constants.path_assets && url)
      return _constants.path_assets + url;
    else
      return url;
  }

  this.Get = function(name) {
    return _constants[name];
  };

  this.GetPath = function(name) {
    return ConcatPath(_constants[name]);
  };


})