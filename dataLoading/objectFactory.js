angular.module('dataLoading')

.factory('objectFactory', [function() {

    function BuildChannelContents(channel_id, data) {

      var channel = data.channels[channel_uuid];
      var contents_transforms = channel.contents;

      var object = new THREE.Object3D();

      for (var i = 0, c = contents_transforms.length; i < c; ++i) {
        var transform = contents_transforms[i];

        var contents = data.contents[transform.uuid];

        if (typeof contents === 'undefined' || typeof contents.object === 'undefined')
          continue;
        var contents_mesh = data.object[contents.object];
        if (typeof contents_mesh === 'undefined')
          continue;

        var mesh = contents_mesh.clone();

        mesh.position.set(transform.position.x, transform.position.y, transform.position.z);
        mesh.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z);
        mesh.scale.multiplyScalar(transform.scale);

        object.add(mesh);
      }

      return object;
    }

    function Parse(json) {
      return new Promise(function(resolve, reject) {

        var object_loader = new AMTHREE.ObjectLoader();

        var object = object_loader.Parse(json);
        object_loader.manager.onLoad(function() {
          resolve(object);
        });

      });
    }

    function Load(url) {
      return new Promise(function(resolve, reject) {

        var loader = new AM.JsonLoader();

        loader.Load(url, function() {
          Parse(loader.json).then(resolve, reject);
        }, function() {
          reject('failed to load object: ' + url);
        });

      });
    }

    return {
      BuildChannelContents: BuildChannelContents,
      Parse: Parse,
      Load: Load
    }

}])