angular.module('data')

.factory('journeyType', ['CoordinatesConverterSvc', function(CoordinatesConverterSvc) {

  /**
  * typedef {string} Uuid
  */

  /**
  * @typedef {object} Point3D
  * @property {number} x
  * @property {number} y
  * @property {number} z
  */


  /**
  *
  * @param {Uuid} [uuid]
  * @param {string} [name]
  */
  function Data(uuid, name) {
    if (typeof uuid !== 'undefined')
      this.uuid = uuid;
    else
      this.uuid = THREE.Math.generateUUID();
    this.name = name || '';
  }

  Data.prototype.Clear = function() {
    this.name = '';
  };

  Data.prototype.Set = function(uuid, name) {
    if (typeof uuid !== 'undefined')
      this.uuid = uuid;
    if (name)
      this.name = name;
    return this;
  };

  Data.prototype.ToJson = function() {
    return {
      uuid: this.uuid,
      name: this.name
    };
  };

  Data.prototype.FromJson = function(json) {
    this.Set(json.uuid, json.name);
    return this;
  };


  /**
  *
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @param {'img'|'tag'} [type]
  * @param {string} [url]
  * @param {number} [tag_id]
  */
  function Marker(uuid, name, type, url, tag_id) {
    Data.call(this, uuid, name);
    this.Set.apply(arguments);
  }

  Marker.prototype = Object.create(Data.prototype);
  Marker.prototype.constructor = Marker;

  Marker.prototype.Set = function(uuid, name, type, url, tag_id) {
    Data.prototype.Set.call(this, uuid, name || 'unnamed marker');

    this.type = type || 'img';
    this.url = url || '';
    this.tag_id = tag_id;

    return this;
  };

  Marker.prototype.ToJson = function() {
    var result = Data.prototype.ToJson.call(this);

    result.type = this.type;
    result.url = AMTHREE.ASSET_PATH + AMTHREE.IMAGE_PATH + GetFilename(this.url);

    if (this.type === 'tag')
      result.tag_id = this.tag_id;

    return result;
  };

  Marker.prototype.FromJson = function(json) {
    this.Set(json.uuid, json.name, json.type, json.url, json.tag_id);
    return this;
  };


  function GetFilename(path) {
    if (path)
      return path.split('/').pop().split('\\').pop();
  }

  function ClonePoint3D(point, default_value) {
    if (typeof point !== 'object') point = {};
    if (typeof default_value !== 'number') default_value = 0;

    return {
      x: point.x || default_value,
      y: point.y || default_value,
      z: point.z || default_value
    };
  }

  function Point3DIsDefault(point, value) {
    if (typeof value === 'undefined')
      value = 0;
    return point.x === value && point.y === value && point.z === value;
  }


  /**
  *
  * @param {Uuid} [object_uuid]
  * @param {string} [name]
  * @param {Point3D} [position]
  * @param {Point3D} [rotation]
  * @param {Point3D} [scale]
  */
  function ObjectTransform(object_uuid, name, position, rotation, scale) {
    this.Set.apply(this, arguments);
  }

  ObjectTransform.prototype.Set = function(object_uuid, name, position, rotation, scale) {
    this.uuid = object_uuid;
    this.name = name || '';
    this.position = ClonePoint3D(position);
    this.rotation = ClonePoint3D(rotation);
    this.scale = ClonePoint3D(scale, 1);
    return this;
  };

  ObjectTransform.prototype.ToJson = function() {
    var result = {
      uuid: this.uuid,
      name: this.name
    };

    if (!Point3DIsDefault(this.position))
      result.position = this.position;
    if (!Point3DIsDefault(this.rotation))
      result.rotation = this.rotation;
    if (!Point3DIsDefault(this.scale, 1))
      result.scale = this.scale;

    return result;
  };

  ObjectTransform.prototype.FromJson = function(json) {
    this.Set(json.uuid, json.name, json.position, json.rotation, json.scale);
    return this;
  };

  ObjectTransform.prototype.ApplyTransform = function(objects) {
    var object = objects[this.uuid];
    if (typeof object === 'undefined')
      return;

    object = object.clone();

    object.position.set(this.position.x, this.position.y, this.position.z);
    object.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
    object.scale.set(this.scale.x, this.scale.y, this.scale.z);

    object.userData.object_transform = this;

    return object;
  };

  ObjectTransform.prototype.Update = function(object) {
    this.position = ClonePoint3D(object.position);
    this.rotation = ClonePoint3D(object.rotation);
    this.scale    = ClonePoint3D(object.scale, 1);
  };

  ObjectTransform.UpdateInnerTransform = function(object) {
    if (object.userData.object_transform instanceof ObjectTransform) {
      object.userData.object_transform.Update(object);
    }
  };


  /**
  *
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @param {Uuid} [marker]
  * @param {ObjectTransform[]} [contents]
  */
  function Channel(uuid, name, marker, contents) {
    Data.call(this, uuid, name);
    this.contents = [];
    this.Set.call(this, uuid, name, marker, contents);
  }

  Channel.prototype = Object.create(Data.prototype);
  Channel.prototype.constructor = Channel;

  Channel.prototype.Set = function(uuid, name, marker, contents) {
    Data.prototype.Set.call(this, uuid, name);

    this.marker = marker;
    if (contents instanceof Array)
      this.contents = contents.slice(0);
    return this;
  };

  Channel.prototype.AddContent = function(object_transform) {
    this.contents.push(object_transform);
    return this;
  };

  Channel.prototype.ToJson = function() {
    var result = Data.prototype.ToJson.call(this);

    result.marker = this.marker;
    result.contents = this.contents.map(function(c) {
      return c.ToJson();
    });

    return result;
  };

  Channel.prototype.FromJson = function(json) {
    Data.prototype.FromJson.call(this, json);

    var transforms = [];

    if (typeof json.contents !== 'undefined') {
      if (json.contents instanceof Array) {
        transforms = json.contents.map(function(e) {
          return (new ObjectTransform()).FromJson(e);
        });
      }
      else
        console.warn('failed to add object transforms: not an array');
    }

    this.Set(json.uuid, json.name, json.marker, transforms);

    return this;
  };

  Channel.prototype.BuildContents = function(objects) {
    var objects_transforms = this.contents;

    var container = new THREE.Object3D();

    for (var i = 0, c = objects_transforms.length; i < c; ++i) {
      var transform = objects_transforms[i];

      var object = transform.ApplyTransform(objects);
      if (object)
        container.add(object);
    }

    return container;
  };

  Channel.UpdateTransforms = function(object) {
    object.children.forEach(ObjectTransform.UpdateInnerTransform);
  };


  /**
  *
  * @param {Uuid} [uuid]
  */
  function PoiChannel(uuid) {
    this.uuid = uuid;
  }

  PoiChannel.prototype.ToJson = function() {
    return {
      uuid: this.uuid
    };
  };


  /**
  *
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @param {number} [latitude]
  * @param {number} [longitude]
  * @param {number} [radius]
  * @param {Channel[]} [channels]
  * @param {ObjectTransform[]} [objects]
  */
  function Poi(uuid, name, latitude, longitude, radius, channels, objects) {
    Data.call(this, uuid, name);

    this.latitude = latitude || 0;
    this.longitude = longitude || 0;
    this.radius = radius || 10;

    if (channels instanceof Array)
      this.channels = channels.slice(0);
    else
      this.channels = [];
    if (objects instanceof Array)
      this.objects = objects.slice(0);
    else
      this.objects = [];
  }

  Poi.prototype = Object.create(Data.prototype);
  Poi.prototype.constructor = Poi;

  Poi.prototype.Set = function(uuid, name, latitude, longitude, radius, channels, objects) {
    Data.prototype.Set.call(this, uuid, name);

    if (typeof latitude === 'number')
      this.latitude = latitude;
    if (typeof longitude === 'number')
      this.longitude = longitude;
    if (typeof radius === 'number')
      this.radius = radius;

    if (channels instanceof Array)
      this.channels = channels.slice(0);
    if (objects instanceof Array)
      this.objects = objects.slice(0);
    return this;
  };

  Poi.prototype.ToJson = function() {
    var result = Data.prototype.ToJson.call(this);

    result.latitude = this.latitude;
    result.longitude = this.longitude;
    result.radius = this.radius;
    result.channels = this.channels.map(function(c) {
      return c.ToJson();
    });
    result.objects = this.objects.map(function(o) {
      return o.ToJson();
    });

    return result;
  };

  Poi.prototype.FromJson = function(json) {
    var channels = [];
    var objects = [];

    if (typeof json.channels !== 'undefined') {
      if (json.channels instanceof Array) {
        channels = json.channels.filter(new DataFilter('PoiChannel')).map(function(e) {
          return new PoiChannel(e.uuid);
        });
      }
      else
        console.warn('failed to add POI channels: not an array');
    }
    if (typeof json.objects !== 'undefined') {
      if (json.objects instanceof Array) {
        objects = json.objects.filter(new DataFilter('ObjectTransform')).map(function(e) {
          return (new ObjectTransform()).FromJson(e);
        });
      }
      else
        console.warn('failed to add POI objects: not an array');
    }

    this.Set(json.uuid, json.name, json.latitude, json.longitude, json.radius, channels, objects);

    return this;
  };

  Poi.prototype.AddChannel = function(poi_channel) {
    var insert = !this.channels.find(function(elem) {
      return poi_channel.uuid === uuid;
    });

    if (insert) {
      poi.channels.push(poi_channel);
    }
    return insert;
  };

  Poi.prototype.AddObject = function(object_transform) {
    this.objects.push(object_transform);
    return true;
  };

  Poi.prototype.CreateBoundsObject = function() {
    var points = [];
    var width = 2;
    var height = 0.5;
    var pos_y = -1;

    var step = width / 3;
    var i = this.radius;

    points.push(new THREE.Vector2(i, 0));
    i += step;
    points.push(new THREE.Vector2(i, height));
    i += step;
    points.push(new THREE.Vector2(i, height));
    i += step;
    points.push(new THREE.Vector2(i, 0));
    var geometry = new THREE.LatheGeometry(points, 64);
    var material = new THREE.MeshBasicMaterial( {
      color: 0x41A3DC,
      opacity: 0.5,
      transparent: true,
      side: THREE.BackSide
    } );
    var position = CoordinatesConverterSvc.ConvertLocalCoordinates(this.latitude, this.longitude);
    var obj = new THREE.Mesh(geometry, material);
    obj.position.x = position.x;
    obj.position.z = position.y;
    obj.position.y = pos_y - height / 2;

    return obj;
  };

  Poi.prototype.CreateScene = function(objects) {
    var container = new THREE.Object3D();

    for (var i = 0, c = this.objects.length; i < c; ++i) {
      var elem = this.objects[i];
      var object = elem.ApplyTransform(objects);
      container.add(object);
    }

    var position = CoordinatesConverterSvc.ConvertLocalCoordinates(this.latitude, this.longitude);
    container.position.x = position.x;
    container.position.z = position.y;

    container.name = this.name;
    container.userData.poi = this;

    return container;
  };

  Poi.UpdateTransforms = function(object) {
    object.children.forEach(ObjectTransform.UpdateInnerTransform);
  };


  /**
  *
  * @class
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @param {Uuid[]} [pois]
  */
  function Journey(uuid, name, pois) {
    Data.call(this, uuid, name);
    
    if (pois instanceof Array)
      this.pois = pois.slice(0);
    else
      this.pois = [];
  }

  Journey.prototype = Object.create(Data.prototype);
  Journey.prototype.constructor = Journey;

  Journey.prototype.Clear = function() {
    Data.prototype.Clear.call(this);
    this.pois.length = 0;
  };

  Journey.prototype.Set = function(uuid, name, pois) {
    Data.prototype.Set.call(this, uuid, name);

    if (pois instanceof Array)
      this.pois = pois.slice(0);
  };

  Journey.prototype.ToJson = function() {
    var result = Data.prototype.ToJson.call(this);
    result.pois = this.pois.slice(0);
    return result;
  };

  Journey.prototype.FromJson = function(json) {
    var pois;
    if (typeof json.pois !== 'undefined') {
      if (json.pois instanceof Array) {
        pois = json.pois;
      }
      else
        console.warn('failed to add POIs: not an array');
    }
    this.Set(json.uuid, json.name, pois);
  };

  Journey.prototype.AddPoi = function(uuid) {
    var insert = (this.pois.indexOf(uuid) < 0);
    if (insert)
      this.pois.push(uuid);
    return insert;
  };


  function DataFilter(type) {
    return function(e, index) {
      var valid = (typeof e.uuid === 'string');
      if (!valid)
        console.warn('failed to add ' + type + ' ' + index + ': no uuid provided');
      return valid;
    };
  }

  function ArraysEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a.length != b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function ArrayToObject(arr) {
    var obj = {};
    if (arr) {
      for (var i = 0, c = arr.length; i < c; ++i) {
        var elem = arr[i];
        obj[elem.uuid] = elem;
      }
    }
    return obj;
  }

  function DataObjectToArray(obj) {
    var ar = [];

    for (var key in obj)
      ar.push(obj[key].ToJson());

    return ar;
  }

  function TraverseObject3DArrayJson(array, fun) {
    if (!array)
      return;

    for (var i = 0; i < array.length; ++i) {
      fun(array[i]);
      TraverseObject3DArrayJson(array[i].children, fun);
    }
  }

  function ObjectToArray(obj) {
    var ar = [];

    for (var key in obj)
      ar.push(obj[key]);

    return ar;
  }

  function ObjectsToJson(objects) {
    var matrix4_identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

    var meta = {
      geometries: {},
      materials : {},
      textures  : {},
      images    : {},
      videos    : {},
      sounds    : {}
    };

    var object_jsons = [];

    for (var id in objects) {
      var elem = objects[id];
      var json = elem.toJSON(meta);

      object_jsons.push(json.object);
    }


    TraverseObject3DArrayJson(object_jsons, function(object) {
      if (ArraysEqual(object.matrix, matrix4_identity))
        delete object.matrix;
    });
    DeleteMetadata(meta.geometries);
    DeleteMetadata(meta.materials);
    DeleteMetadata(meta.textures);
    DeleteMetadata(meta.images);

    return {
      objects:    object_jsons,
      geometries: ObjectToArray(meta.geometries),
      materials:  ObjectToArray(meta.materials),
      textures:   ObjectToArray(meta.textures),
      images:     ObjectToArray(meta.images),
      videos:     ObjectToArray(meta.videos),
      sounds:     ObjectToArray(meta.sounds),
      constants: {
        image_path: AMTHREE.IMAGE_PATH,
        model_path: AMTHREE.MODEL_PATH,
        video_path: AMTHREE.VIDEO_PATH,
        sound_path: AMTHREE.SOUND_PATH,
        asset_path: AMTHREE.ASSET_PATH
      }
    };
  }

  function DeleteMetadata(object) {
    for (var key in object) {
      delete object[key].metadata;
    }
  }

  /**
  *
  */
  function DataJourney() {
    this.journey = new Journey();
    this.pois = {};
    this.channels = {};
    this.markers = {};
    this.objects = {};
  }

  DataJourney.prototype.Clear = function() {
    this.journey.Clear();
    this.pois.length = 0;
    this.channels.length = 0;
    this.markers.length = 0;
    this.objects.length = 0;
  };

  DataJourney.prototype.Set = function(journey, pois, channels, markers, objects) {
    if (typeof journey !== 'undefined')
      this.journey.Set(journey.uuid, journey.name, journey.pois);
    if (pois instanceof Array)
      this.pois = ArrayToObject(pois);
    if (channels instanceof Array)
      this.channels = ArrayToObject(channels);
    if (markers instanceof Array)
      this.markers = ArrayToObject(markers);
    if (objects instanceof Array)
      this.objects = ArrayToObject(objects);
  };

  DataJourney.prototype.ToJson = function() {
    return {
      journey:  this.journey.ToJson(),
      pois:     DataObjectToArray(this.pois),
      channels: DataObjectToArray(this.channels),
      markers:  DataObjectToArray(this.markers),
      objects:  ObjectsToJson(this.objects)
    };
  };

  DataJourney.prototype.FromJson = function(json) {
    var scope = this;
    var promise = AMTHREE.ParseObjectArray(json.objects).then(function(objects) {
      var journey = new Journey();
      var pois, channels, markers;

      if (typeof json.journey === 'object')
        journey.FromJson(json.journey);
      if (json.pois instanceof Array) {
        pois = json.pois.filter(new DataFilter('POI')).map(function(e) {
          return (new Poi()).FromJson(e);
        });
      }
      if (json.channels instanceof Array) {
        channels = json.channels.filter(new DataFilter('channel')).map(function(e) {
          return (new Channel()).FromJson(e);
        });
      }
      if (json.markers instanceof Array) {
        markers = json.markers.filter(new DataFilter('marker')).map(function(e) {
          return (new Marker()).FromJson(e);
        });
      }
      scope.Set(journey, pois, channels, markers, objects);
    },
    function(e) {
      console.warn(e);
    });
    return promise;
  };


  return {
    Data: Data,
    ObjectTransform: ObjectTransform,
    PoiChannel: PoiChannel,
    Marker: Marker,
    Channel: Channel,
    Poi: Poi,
    Journey: Journey,
    DataJourney: DataJourney
  };

}]);