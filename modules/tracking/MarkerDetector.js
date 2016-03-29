function MarkerDetector() {
  var _tag_detector = new AR.Detector();
  var _tag_detector_enabled = true;

  var _marker_tracker = new AM.MarkerTracker();
  var _marker_tracker_enabled = true;

  var _commands = {
    new_img:                CmdOnNewImage,
    add_marker:             CmdAddMarker,
    clear:                  CmdClear,
    active_all:             CmdActiveAll,
    active:                 CmdActive,
    enable_tag_detection:   CmdEnableTagDetection,
    enable_image_detection: CmdEnableImageDetection
  }

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


  function DetectMarkerImage(image_data) {
    _marker_tracker.Log();

    _marker_tracker.ComputeImage(image_data);
    if (_marker_tracker.Match()) {
      return { corners: _marker_tracker.GetPose(), uuid: _marker_tracker.GetMatchUuid() };
    }

    return undefined;
  }

  function DetectTags(image) {
    return _tag_detector.detect(image);
  }

  function OnNewImage(image) {
    var tags;
    
    if (_tag_detector_enabled)
      tags = DetectTags(image);
    else
      tags = [];

    var marker;
    if (_marker_tracker_enabled)
      marker = DetectMarkerImage(image);

    return {
      tags: tags,
      marker: marker
    }
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
    var fun = _commands[cmd];
    if (fun)
      return fun(data);
  }

  function CmdOnNewImage(data)           { return OnNewImage(data.image); }
  function CmdAddMarker(data)            { AddMarker(data.image_data, data.uuid); }
  function CmdClear()                    { Clear(); }
  function CmdActiveAll(data)            { ActiveAll(data.value); }
  function CmdActive(data)               { Active(data.uuid, data.value); }
  function CmdEnableTagDetection(data)   { EnableTagDetection(data.value); }
  function CmdEnableImageDetection(data) { EnableImageDetection(data.value); }

  this.Command = Command;
  this.AddMarker = AddMarker;
  this.Clear = Clear;
  this.ActiveAll = ActiveAll;
  this.Active = Active;
  this.EnableImageDetection = EnableImageDetection;
  this.EnableTagDetection = EnableTagDetection;
  this.ComputeImage = OnNewImage;
}