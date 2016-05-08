function MarkerDetector() {
  var _tag_detector = new AR.Detector();
  var _tag_detector_enabled = true;

  var _marker_tracker = new AM.MarkerTracker();
  var _marker_tracker_enabled = true;

  var _debug=false;

  var _commands = {
    new_img:                CmdOnNewImage,
    add_marker:             CmdAddMarker,
    clear:                  CmdClear,
    active_all:             CmdActiveAll,
    active:                 CmdActive,
    enable_tag_detection:   CmdEnableTagDetection,
    enable_image_detection: CmdEnableImageDetection,
    use_fixed_angle:        CmdUseFixedAngle
  };

  _marker_tracker.SetParameters({
    laplacian_threshold:   30,
    eigen_threshold:       25,
    detection_corners_max: 200,
    match_threshold:       40,
    num_train_levels:      3,
    image_size_max:        256,
    training_corners_max:  150,
    blur:                  true,
    blur_size:             5
  });


  function DetectMarkerImage(image_data, fixed_angle) {
    //_marker_tracker.Log();

    _marker_tracker.ComputeImage(image_data, fixed_angle);

    var matched = _marker_tracker.Match();
    var result = {
      matched: matched,
      profiles: _marker_tracker.GetProfiler()
    };

    if (matched) {
      result.uuid = _marker_tracker.GetMatchUuid();
      result.corners = _marker_tracker.GetPose();
    }
    if (_debug) {
      result.trained_corners = _marker_tracker.GetTrainedCorners();
      result.trained_descriptors = _marker_tracker.GetTrainedDescriptors();
      result.screen_corners = _marker_tracker.GetScreenCorners();
      result.matches = _marker_tracker.GetMatches();
      result.matches_mask = _marker_tracker.GetMatchesMask();
      result.image_data = image_data;
      result.last_uuid = _marker_tracker.GetLastUuid();
    }

    return result;

    // if(_debug) {
    //     return { 
    //       matched: ,
    //       uuid:    _marker_tracker.GetMatchUuid(),
    //       corners: _marker_tracker.GetPose(),
    //       trained_corners:_marker_tracker.GetTrainedCorners(),
    //       screen_corners: _marker_tracker.GetScreenCorners(),
    //       matches: _marker_tracker.GetMatches(),
    //       matches_mask: _marker_tracker.GetMatchesMask(),
    //       profiles: _marker_tracker.GetProfiler(),
    //       image_data: image_data  // warning, put this object at the end or it crashes (webworker only pas stringable objects through Postmessages)
    //     };    
    // }
    // else { // not debug
    //   if (_marker_tracker.Match()) 
    //     return { 
    //       matched: true,
    //       uuid:    _marker_tracker.GetMatchUuid(),
    //       profiles: _marker_tracker.GetProfiler(),
    //       corners: _marker_tracker.GetPose()
    //     };

    //   return { 
    //     matched: false,
    //     profiles: _marker_tracker.GetProfiler()
    //   };  
    // }
  }

  function DetectTags(image) {
    return _tag_detector.detect(image);
  }

  function OnNewImage(image, angle) {
    var tags;
    
    if (_tag_detector_enabled)
      tags = DetectTags(image);
    else
      tags = [];

    var marker;
    if (_marker_tracker_enabled)
      marker = DetectMarkerImage(image, angle);

    return {
      tags: tags,
      marker: marker
    };
  }

  function AddMarker(image_data, uuid) {
    _marker_tracker.AddMarker(image_data, uuid);
  }

  function Clear() {
    _marker_tracker.ClearMarkers();
  }

  function ActiveAll(bool) {
    _marker_tracker.ActiveAllMarkers(bool);
  }

  function Active(uuid, bool) {
    _marker_tracker.ActiveMarker(uuid, bool);
  }

  function EnableTagDetection(bool) {
    _tag_detector_enabled = bool;
  }

  function EnableImageDetection(bool) {
    _marker_tracker_enabled = bool;
  }

  function Command(cmd, data) {
    SetDebug(data.debug);
    var fun = _commands[cmd];
    if (fun)
      return fun(data);
  }

  function  SetDebug(bool) {
    _debug=bool;
  }

  function UseFixedAngle(bool) {
    _marker_tracker.UseFixedAngle(bool);
  }

  function CmdOnNewImage(data)           { return OnNewImage(data.image, data.angle); }
  function CmdAddMarker(data)            { AddMarker(data.image_data, data.uuid); }
  function CmdClear()                    { Clear(); }
  function CmdActiveAll(data)            { ActiveAll(data.value); }
  function CmdActive(data)               { Active(data.uuid, data.value); }
  function CmdEnableTagDetection(data)   { EnableTagDetection(data.value); }
  function CmdEnableImageDetection(data) { EnableImageDetection(data.value); }
  function CmdUseFixedAngle(data)        { UseFixedAngle(data.value); }

  this.Command = Command;
  this.AddMarker = AddMarker;
  this.Clear = Clear;
  this.ActiveAll = ActiveAll;
  this.Active = Active;
  this.EnableImageDetection = EnableImageDetection;
  this.EnableTagDetection = EnableTagDetection;
  this.ComputeImage = OnNewImage;
  this.SetDebug = SetDebug;
  this.UseFixedAngle = UseFixedAngle;
}