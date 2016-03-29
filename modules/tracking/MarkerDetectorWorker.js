window = self;

var LIB_PATH = '../../lib/';

// aruco
importScripts(LIB_PATH + 'js-aruco/src/cv.js');
importScripts(LIB_PATH + 'js-aruco/src/aruco.js');
importScripts(LIB_PATH + 'js-aruco/src/svd.js');
importScripts(LIB_PATH + 'js-aruco/src/posit1.js');

// jsfeat
importScripts(LIB_PATH + 'jsfeat/build/jsfeat.js');

importScripts(LIB_PATH + 'ArtMobilib/build/artmobilib.js');

importScripts('./MarkerDetector.js');


var _marker_detector = new MarkerDetector();


function SendResult(tags, marker, frame) {
  var msg = {
    cmd: 'markers',
    tags: tags,
    marker: marker,
    frame: frame
  };

  postMessage(msg);
}

onmessage = function(e) {
  var cmd = e.data.cmd;
  var result = _marker_detector.Command(cmd, e.data);

  if (cmd === 'new_img') {
    SendResult(result.tags, result.marker, e.data.frame);
  }
  else if (cmd === 'add_marker') {
    var msg = {
      cmd: 'marker_added',
      uuid: e.data.uuid
    };
    postMessage(msg);
  }
};