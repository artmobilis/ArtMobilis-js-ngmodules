angular.module('data')

.service('DataManagerSvc', ['Journey', 'ChannelsManager', 'ConstantSvc',
  function(Journey, ChannelsManager, ConstantSvc) {
  var that = this;

  var _contents_loader = new AM.JsonLoader();
  var _markers_loader = new AM.JsonLoader();
  var _channels_loader = new AM.JsonLoader();
  var _loading_manager = new AM.LoadingManager();

  var _journey = new Journey();

  var _presets_loaded = false;


  this.tracking_data_manager = new ChannelsManager();


  this.LoadMarkers = function(url) {
    _loading_manager.Start();
    _markers_loader.Load(url, function() {
      that.tracking_data_manager.ParseMarkers(_markers_loader.json);
      _loading_manager.End();
    }, function(error) {
      console.log('DataManagerSvc: failed to load markers: ' + error);
      _loading_manager.End();
    });
  };

  this.LoadContents = function(url) {
    _loading_manager.Start();
    _contents_loader.Load(url, function() {
      that.tracking_data_manager.ParseContents(_contents_loader.json);
      _loading_manager.End();
    }, function(error) {
      console.log('DataManagerSvc: failed to load contents: ' + error);
      _loading_manager.End();
    });
  };

  this.LoadChannels = function(url) {
    _loading_manager.Start();
    _channels_loader.Load(url, function() {
      that.tracking_data_manager.ParseChannels(_channels_loader.json);
      _loading_manager.End();
    }, function(error) {
      console.log('DataManagerSvc: failed to load channels: ' + error);
      _loading_manager.End();
    });
  };

  this.LoadContentsAssets = function(url) {
    _loading_manager.Start();
    this.tracking_data_manager.LoadContentsAssets(url);
    this.tracking_data_manager.OnLoadContentsAssets(function() {
      _loading_manager.End();
    });
  };

  this.OnLoad = function(on_load) {
    _loading_manager.OnEnd(on_load);
  };

  this.IsLoading = function() {
    return _loading_manager.IsLoading();
  };

  this.LoadChannelsPresets = function() {
    if (!_presets_loaded) {
      _presets_loaded = true;
      that.LoadContentsAssets(ConstantSvc.GetPath('path_objects'));
      that.LoadMarkers(ConstantSvc.GetPath('path_markers'));
      that.LoadContents(ConstantSvc.GetPath('path_contents'));
      that.LoadChannels(ConstantSvc.GetPath('path_channels'));
    }
  };

  this.LoadJourney = function(url, on_load, on_error) {
    _loading_manager.Start();

    var OnLoad = function() {
      return function() {
        _loading_manager.End();
        on_load();
      };
    }(on_load);

    _journey.Load(url, OnLoad, on_error);
  };

  this.GetJourney = function() {
    return _journey;
  };

}])



DataManagerSvc = function() {
  var that = this;

  var _journey_data;


  this.GetData = function() {
    return _journey_data;
  }
}