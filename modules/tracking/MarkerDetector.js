/**
* Wraps generic image and Aruco marker detection and 3D pose, and eases its usage inside a WebWorker.
* @class
*/
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
    laplacian_threshold:   20,
    eigen_threshold:       25,
    detection_corners_max: 1000,
    match_threshold:       40,
    num_train_levels:      3,
    image_size_max:        300,
    training_corners_max:  400,
    blur:                  true,
    blur_size:             5
  });


  /**
  * @typedef {object} MarkerDetector.ImageDetectionResult
  * @property {boolean} matched
  * @property {object} profiles
  */

  /**
  * @typedef {object} MarkerDetector.ArucoCorner
  * @property {number} x
  * @property {number} y
  */

  /**
  * @typedef {MarkerDetector.ArucoCorner[]} MarkerDetector.ArucoMarkerMatch
  */

  /**
  * @typedef {object} MarkerDetector.ImageMatch
  * @property {boolean} matched
  * @property {object} profiles - debug information
  * @property {Uuid | undefined} uuid - provided if this.matched == true, uuid of the matched marker
  * @property {jsfeat.keypoint_t[] | undefined} corners - provided if this.matched == true, screen's corners that matched corners of the marker
  * @property {jsfeat.keypoint_t[] | undefined} trained_corners - debug information provided only in debug mode
  * @property {jsfeat.matrix_t | undefined} trained_descriptors - debug information provided only in debug mode
  * @property {jsfeat.keypoint_t[] | undefined} screen_corners - debug information provided only in debug mode
  * @property {AM.match_t[] | undefined} matches - debug information provided only in debug mode
  * @property {AM.match_t[] | undefined} matches_mask - debug information provided only in debug mode
  * @property {ImageData | undefined} image_data - debug information provided only in debug mode
  * @property {Uuid | undefined} last_uuid - debug information provided only in debug mode
  */

  /**
  * @typedef {object} MarkerDetector.ComputeImageResult
  * @property {MarkerDetector.ArucoMarkerMatch[]} tags
  * @property {MarkerDetector.ImageMatch} marker
  */

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

  /**
  *
  * @function
  * @param {'new_img'|'add_marker'|'clear'|'active_all'|'active'|'enable_tag_detection'|'enable_image_detection'|'use_fixed_angle'} cmd
  * @param {object} data
  */
  this.Command = Command;

  /**
  *
  * @function
  * @param {ImageData} image_data
  * @param {Uuid} uuid
  */
  this.AddMarker = AddMarker;

  /**
  * Removes every trained marker.
  * @function
  */
  this.Clear = Clear;

  /**
  * Enables of disables the detection of every marker.
  * @function
  * @param {boolean} bool
  */
  this.ActiveAll = ActiveAll;

  /**
  * Enables or disables the detection of a marker.
  * @function
  * @param {Uuid} uuid
  * @param {boolean} bool
  */
  this.Active = Active;

  /**
  *
  * @function
  * @param {boolean} bool
  */
  this.EnableImageDetection = EnableImageDetection;

  /**
  *
  * @function
  * @param {boolean} bool
  */
  this.EnableTagDetection = EnableTagDetection;

  /**
  *
  * @function
  * @param {ImageData} image_data
  * @param {number} fixed_angle
  * @returns {MarkerDetector.ComputeImageResult}
  */
  this.ComputeImage = OnNewImage;

  /**
  *
  * @function
  * @param {boolean} bool - disabled by default
  */
  this.SetDebug = SetDebug;

  /**
  *
  * @function
  * @param {boolean} bool - disabled by default
  */
  this.UseFixedAngle = UseFixedAngle;
}