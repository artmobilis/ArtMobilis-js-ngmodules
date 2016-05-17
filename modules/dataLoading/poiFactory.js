/**
 * @class poiFactory
 * @memberOf angular_module.dataLoading
 */

angular.module('dataLoading')

.factory('poiFactory', ['dataArrayFactory', 'CoordinatesConverterSvc',
  function(dataArrayFactory, CoordinatesConverterSvc) {

  /**
   * @typedef {object} POI
   * @property {value} uuid
   * @property {string} name
   * @property {number} latitude
   * @property {number} longitude
   * @property {number} radius
   * @property {object[]} channels
   * @property {value} channels[].uuid - id of the channel
   * @property {value} channels[].object - optionnal - id of the object used as a landmark
   * @property {number} channels[].longitude
   * @property {number} channels[].latitude
   * @property {number} channels[].altitude
   * @property {number} channels[].scale
   * @property {object[]} objects
   * @property {value} objects[].uuid
   * @property {string} objects[].name
   * @property {Point3D} objects[].position
   * @property {Point3D} objects[].rotation
   * @property {Point3D} objects[].scale
   */

  function ClonePoint3D(point, default_value) {
    if (typeof point !== 'object') point = {};
    if (typeof default_value !== 'number') default_value = 0;

    return {
      x: point.x || default_value,
      y: point.y || default_value,
      z: point.z || default_value
    };
  }

  function poiChannelToJSON(name) {
    return {
      uuid: this.uuid,
      object: this.object,
      longitude: this.longitude,
      latitude: this.latitude,
      altitude: this.altitude,
      scale: this.scale
    };
  }

  function poiObjectToJSON(name) {
    return {
      uuid: this.uuid,
      name: this.name,
      position: this.position,
      rotation: this.rotation,
      scale: this.scale
    };
  }

  function AddObject(poi, uuid, name, position, rotation, scale) {
    var new_obj = {
      uuid: uuid,
      name: name || 'unnamed object',
      position: ClonePoint3D(position),
      rotation: ClonePoint3D(rotation),
      scale: ClonePoint3D(scale, 1),
      toJSON: poiObjectToJSON
    };

    poi.objects.push(new_obj);
  }
  
  function AddChannel(poi, uuid, object, longitude, latitude, altitude, scale) {
    var found = poi.channels.find(function(elem) {
      return elem.uuid === uuid;
    });

    if (!found) {
      var new_chan = {
        uuid: uuid,
        object: object,
        longitude: longitude || 0,
        latitude: latitude || 0,
        altitude: altitude || 0,
        scale: scale || 1,
        toJSON: poiChannelToJSON
      };
      new_chan.position = CoordinatesConverterSvc.ConvertLocalCoordinates(latitude, longitude);
      poi.channels.push(new_chan);
    }
    return !found;
  }

  function toJSON() {
    return {
      uuid: this.uuid,
      name: this.name,
      latitude: this.latitude,
      longitude: this.longitude,
      radius: this.radius,
      channels: this.channels,
      objects: this.objects
    };
  }

  function Create(id, name, latitude, longitude, radius, channels, objects) {
    if (typeof id === 'undefined')
      return;

    var i, c;

    var poi = {
      uuid: id,
      name: name || 'unnamed poi',
      latitude: latitude || 0,
      longitude: longitude || 0,
      radius: radius || 10,
      channels: [],
      objects: [],
      toJSON: toJSON
    };
    UpdatePosition(poi);

    if (channels) {
      for (i = 0, c = channels.length; i < c; ++i) {
        var channel = channels[i];
        if (typeof channel.uuid !== 'undefined') {
          AddChannel(poi, channel.uuid, channel.object, channel.longitude,
            channel.latitude, channel.altitude, channel.scale);
        }
        else
          console.warn('failed to add channel to POI: uuid undefined');
      }
    }

    if (objects) {
      for (i = 0, c = objects.length; i < c; ++i) {
        var o = objects[i];
        if (typeof o.uuid !== 'undefined') {
          AddObject(poi, o.uuid, o.name, o.position, o.rotation, o.scale);
        }
      }
    }

    return poi;
  }

  function Load(url) {
    return new Promise(function(resolve, reject) {

      var loader = new AM.JsonLoader();

      loader.load(url, function() {
        Parse(loader.json).then(resolve, reject);
      }, function() {
        reject('failed to load POI: ' + url);
      });

    });
  }

  function Parse(json) {
    return new Promise(function(resolve, reject) {
      if (typeof json === 'object') {
        var result = Create(json.uuid, json.name, json.latitude,
          json.longitude, json.radius, json.channels, json.objects);
        if (result)
          resolve(result);
        else
          reject('failed to create POI: id undefined');
      }
      else
        reject('failed to parse poi json: not an object');
    });
  }

  var LoadArray = function(url) { return dataArrayFactory.Load(url, Parse); };
  var ParseArray = function(json) { return dataArrayFactory.Parse(json, Parse); };

  function PointToVec(point, vec) {
    vec.x = point.x;
    vec.y = point.y;
    vec.z = point.z;
  }

  function ToObject3D(poi, objects) {
    var container = new THREE.Object3D();

    for (var i = 0, c = poi.objects.length; i < c; ++i) {
      var elem = poi.objects[i];
      var object = objects[elem.uuid];
      if (object) {
        var clone = object.clone();
        PointToVec(elem.position, clone.position);
        PointToVec(elem.rotation, clone.rotation);
        PointToVec(elem.scale, clone.scale);
        clone.name = elem.name;
        clone.userData = { index: i };
        container.add(clone);
      }
    }

    var position = CoordinatesConverterSvc.ConvertLocalCoordinates(poi.latitude, poi.longitude);
    container.position.x = position.x;
    container.position.z = position.y;

    container.name = poi.name;
    return container;
  }

  function UpdatePosition(poi) {
    poi.position = CoordinatesConverterSvc.ConvertLocalCoordinates(poi.latitude, poi.longitude);
  }

  function CreateBoundsObject() {
    var points = [];
    points.push(new THREE.Vector2(1, 0));
    points.push(new THREE.Vector2(1.1, 2));
    points.push(new THREE.Vector2(1.2, 2));
    points.push(new THREE.Vector2(1.3, 0));
    var geometry = new THREE.LatheGeometry(points, 64);
    var material = new THREE.MeshBasicMaterial( {
      color: 0x41A3DC,
      opacity: 0.5,
      transparent: true,
      side: THREE.BackSide
    } );
    var obj = new THREE.Mesh(geometry, material);
    obj.position.y = -3;

    return obj;
  }

  return {
    Create: Create,
    Load: Load,
    Parse: Parse,
    LoadArray: LoadArray,
    ParseArray: ParseArray,
    AddChannel: AddChannel,
    AddObject: AddObject,
    ToObject3D: ToObject3D,
    UpdatePosition: UpdatePosition,
    CreateBoundsObject: CreateBoundsObject
  };


}]);