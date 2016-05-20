/**
* @class angular_module.data.journeyType
* @memberOf angular_module.data
*/

angular.module('data')

.factory('journeyType', ['CoordinatesConverterSvc', function(CoordinatesConverterSvc) {

  /**
  * @typedef {string} Uuid
  */

  /**
  * @typedef {object} Point3D
  * @property {number} x
  * @property {number} y
  * @property {number} z
  */


  /**
  * Base class
  * @class angular_module.data.journeyType.Data
  * @memberOf angular_module.data.journeyType
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @property {Uuid} uuid
  * @property {string} name
  */
  function Data(uuid, name) {
    if (typeof uuid !== 'undefined')
      this.uuid = uuid;
    else
      this.uuid = THREE.Math.generateUUID();
    this.name = name || '';
  }

  /**
  *
  * @memberof angular_module.data.journeyType.Data#
  * @function Clear
  */
  Data.prototype.Clear = function() {
    this.name = '';
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Data#
  * @function Set
  * @param {Uuid} uuid
  * @param {string} name
  * @returns {angular_module.data.journeyType.Data} this
  */
  Data.prototype.Set = function(uuid, name) {
    if (typeof uuid !== 'undefined')
      this.uuid = uuid;
    if (name)
      this.name = name;
    return this;
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Data#
  * @function ToJson
  * @returns {object} json object
  */
  Data.prototype.ToJson = function() {
    return {
      uuid: this.uuid,
      name: this.name
    };
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Data#
  * @function FromJson
  * @param {object} json
  * @returns {angular_module.data.journeyType.Data} this
  */
  Data.prototype.FromJson = function(json) {
    this.Set(json.uuid, json.name);
    return this;
  };


  /**
  *
  * @class angular_module.data.journeyType.Marker
  * @memberOf angular_module.data.journeyType
  * @augments angular_module.data.journeyType.Data
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @param {'img'|'tag'} [type]
  * @param {string} [url]
  * @param {number} [tag_id]
  * @property {Uuid} uuid
  * @property {string} name
  * @property {'img'|'tag'} type
  * @property {string} url
  * @property {number} tag_id
  */
  function Marker(uuid, name, type, url, tag_id) {
    Data.call(this, uuid);
    this.Clear();
    this.Set(uuid, name, type, url, tag_id);
  }

  Marker.prototype = Object.create(Data.prototype);
  Marker.prototype.constructor = Marker;

  /**
  *
  * @memberof angular_module.data.journeyType.Marker#
  * @function Set
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @param {'img'|'tag'} [type]
  * @param {string} [url]
  * @param {number} [tag_id]
  * @returns {angular_module.data.journeyType.Marker} this
  */
  Marker.prototype.Set = function(uuid, name, type, url, tag_id) {
    Data.prototype.Set.call(this, uuid, name);

    if (typeof type === 'string')
      this.type = type;
    if (typeof url === 'string')
      this.url = url;
    if (typeof tag_id === 'number')
      this.tag_id = tag_id;

    return this;
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Marker#
  * @function ToJson
  * @returns {object} json object
  */
  Marker.prototype.ToJson = function() {
    var result = Data.prototype.ToJson.call(this);

    result.type = this.type;
    result.url = AMTHREE.ASSET_PATH + AMTHREE.IMAGE_PATH + GetFilename(this.url);

    if (this.type === 'tag')
      result.tag_id = this.tag_id;

    return result;
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Marker#
  * @function FromJson
  * @param {object} json
  * @returns {angular_module.data.journeyType.Marker} this
  */
  Marker.prototype.FromJson = function(json) {
    this.Set(json.uuid, json.name, json.type, json.url, json.tag_id);
    return this;
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Marker#
  * @function Clear
  */
  Marker.prototype.Clear = function() {
    Data.prototype.Clear.call(this);
    this.type = 'img';
    this.url = '';
    this.tag_id = -1;
  };


  function GetFilename(path) {
    if (path)
      return path.split('/').pop().split('\\').pop();
  }

  function CopyPoint3D(dst, src, default_value) {
    if (typeof default_value !== 'number') default_value = 0;

    dst.x = (typeof src.x === 'number') ? src.x : default_value;
    dst.y = (typeof src.y === 'number') ? src.y : default_value;
    dst.z = (typeof src.z === 'number') ? src.z : default_value;
  }

  function Point3DIsDefault(point, value) {
    if (typeof value === 'undefined')
      value = 0;
    return point.x === value && point.y === value && point.z === value;
  }

  function ResetPoint3D(point, value) {
    point.x = value;
    point.y = value;
    point.z = value;
  }


  /**
  *
  * @class angular_module.data.journeyType.ObjectTransform
  * @memberOf angular_module.data.journeyType
  * @param {Uuid} [object_uuid]
  * @param {string} [name]
  * @param {Point3D} [position]
  * @param {Point3D} [rotation]
  * @param {Point3D} [scale]
  * @property {Uuid} uuid
  * @property {string} name
  * @property {Point3D} position
  * @property {Point3D} rotation
  * @property {Point3D} scale
  */
  function ObjectTransform(object_uuid, name, position, rotation, scale) {
    this.uuid = undefined;
    this.name = '';
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale    = { x: 1, y: 1, z: 1 };
    this.Set(object_uuid, name, position, rotation, scale);
  }


  /**
  *
  * @memberof angular_module.data.journeyType.ObjectTransform#
  * @function Set
  * @param {Uuid} [object_uuid]
  * @param {string} [name]
  * @param {Point3D} [position]
  * @param {Point3D} [rotation]
  * @param {Point3D} [scale]
  * @returns {angular_module.data.journeyType.ObjectTransform} this
  */
  ObjectTransform.prototype.Set = function(object_uuid, name, position, rotation, scale) {
    if (typeof object_uuid === 'string')
      this.uuid = object_uuid;
    if (typeof name === 'string')
      this.name = name;
    if (typeof position !== 'undefined')
      CopyPoint3D(this.position, position);
    if (typeof rotation !== 'undefined')
      CopyPoint3D(this.rotation, rotation);
    if (typeof scale !== 'undefined')
      CopyPoint3D(this.scale, scale, 1);
    return this;
  };

  /**
  *
  * @memberof angular_module.data.journeyType.ObjectTransform#
  * @function ToJson
  * @returns {object} json object
  */
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

  /**
  *
  * @memberof angular_module.data.journeyType.ObjectTransform#
  * @function FromJson
  * @param {object} json
  * @returns {angular_module.data.journeyType.ObjectTransform} this
  */
  ObjectTransform.prototype.FromJson = function(json) {
    this.Set(json.uuid, json.name, json.position, json.rotation, json.scale);
    return this;
  };

  /**
  * Creates a clone of the target object and applies the transform to it.
  * @memberof angular_module.data.journeyType.ObjectTransform#
  * @function ApplyTransform
  * @param {Object.<THREE.Object3D>} objects
  * @returns {THREE.Object3D}
  */
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

  /**
  * Copies the transform of an THREE.Object3D to this.
  * @memberof angular_module.data.journeyType.ObjectTransform#
  * @function Update
  * @param {THREE.Object3D} object
  */
  ObjectTransform.prototype.Update = function(object) {
    CopyPoint3D(this.position, position);
    CopyPoint3D(this.rotation, rotation);
    CopyPoint3D(this.scale, scale, 1);
  };

  /**
  *
  * @memberof angular_module.data.journeyType.ObjectTransform#
  * @function Clear
  */
  ObjectTransform.prototype.Clear = function() {
    this.uuid = undefined;
    this.name = '';
    ResetPoint3D(this.position, 0);
    ResetPoint3D(this.rotation, 0)
    ResetPoint3D(this.scale, 1);
  };

  /**
  * Updates the ObjectTransform that a THREE.Object3D has been created from.
  * @memberof angular_module.data.journeyType.ObjectTransform
  * @function UpdateInnerTransform
  * @param {THREE.Object3D} object
  */
  ObjectTransform.UpdateInnerTransform = function(object) {
    if (object.userData.object_transform instanceof ObjectTransform) {
      object.userData.object_transform.Update(object);
    }
  };


  /**
  *
  * @class angular_module.data.journeyType.Channel
  * @memberOf angular_module.data.journeyType
  * @augments angular_module.data.journeyType.Data
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @param {Uuid} [marker]
  * @param {angular_module.data.journeyType.ObjectTransform[]} [contents]
  * @property {Uuid} uuid
  * @property {string} name
  * @property {Uuid} marker
  * @property {angular_module.data.journeyType.ObjectTransform[]} contents
  */
  function Channel(uuid, name, marker, contents) {
    Data.call(this, uuid, name);
    this.marker = undefined;
    this.contents = [];
    this.Set.call(this, uuid, name, marker, contents);
  }

  Channel.prototype = Object.create(Data.prototype);
  Channel.prototype.constructor = Channel;

  /**
  *
  * @memberof angular_module.data.journeyType.Channel#
  * @function Set
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @param {Uuid} [marker]
  * @param {angular_module.data.journeyType.ObjectTransform[]} [contents]
  * @returns {angular_module.data.journeyType.Channel} this
  */
  Channel.prototype.Set = function(uuid, name, marker, contents) {
    Data.prototype.Set.call(this, uuid, name);

    if (typeof marker === 'string')
      this.marker = marker;
    if (contents instanceof Array)
      this.contents = contents.slice(0);
    return this;
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Channel#
  * @function AddContent
  * @param {angular_module.data.journeyType.ObjectTransform} object_transform
  */
  Channel.prototype.AddContent = function(object_transform) {
    this.contents.push(object_transform);
    return this;
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Channel#
  * @function ToJson
  * @returns {object} json object
  */
  Channel.prototype.ToJson = function() {
    var result = Data.prototype.ToJson.call(this);

    result.marker = this.marker;
    result.contents = this.contents.map(function(c) {
      return c.ToJson();
    });

    return result;
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Channel#
  * @function FromJson
  * @param {object} json
  * @returns {angular_module.data.journeyType.Channel} this
  */
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

  /**
  * Creates an object parent of the content objects transformed of this channel.
  * @memberof angular_module.data.journeyType.Channel#
  * @function BuildContents
  * @param {Object.<THREE.Object3D>} objects
  * @returns {THREE.Object3D}
  */
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

  /**
  * Updates the ObjectTransform associated with each direct child of a THREE.Object3D.
  * @memberof angular_module.data.journeyType.Channel
  * @function UpdateTransforms
  * @param {THREE.Object3D} object - Should be created by Channel.BuildContents function.
  */
  Channel.UpdateTransforms = function(object) {
    object.children.forEach(ObjectTransform.UpdateInnerTransform);
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Channel#
  * @function Clear
  */
  Channel.prototype.Clear = function() {
    Data.prototype.Clear.call(this);
    this.marker = undefined;
    this.contents.length = 0;
  };


  /**
  *
  * @class angular_module.data.journeyType.PoiChannel
  * @memberOf angular_module.data.journeyType
  * @param {Uuid} [uuid]
  */
  function PoiChannel(uuid) {
    this.uuid = uuid;
  }

  /**
  *
  * @memberof angular_module.data.journeyType.PoiChannel#
  * @function ToJson
  * @returns {object} json object
  */
  PoiChannel.prototype.ToJson = function() {
    return {
      uuid: this.uuid
    };
  };


  /**
  *
  * @class angular_module.data.journeyType.Poi
  * @memberOf angular_module.data.journeyType
  * @augments angular_module.data.journeyType.Data
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @param {number} [latitude]
  * @param {number} [longitude]
  * @param {number} [radius]
  * @param {angular_module.data.journeyType.Channel[]} [channels]
  * @param {angular_module.data.journeyType.ObjectTransform[]} [objects]
  * @property {Uuid} uuid
  * @property {string} name
  * @property {number} latitude
  * @property {number} longitude
  * @property {number} radius
  * @property {angular_module.data.journeyType.Channel[]} channels
  * @property {angular_module.data.journeyType.ObjectTransform[]} objects
  */
  function Poi(uuid, name, latitude, longitude, radius, channels, objects) {
    Data.call(this, uuid);
    this.latitude = 0;
    this.longitude = 0;
    this.radius = 10;
    this.channels = [];
    this.objects = [];
    this.Set(uuid, name, latitude, longitude, radius, channels, objects);
  }

  Poi.prototype = Object.create(Data.prototype);
  Poi.prototype.constructor = Poi;

  /**
  *
  * @memberof angular_module.data.journeyType.Poi#
  * @function Set
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @param {number} [latitude]
  * @param {number} [longitude]
  * @param {number} [radius]
  * @param {angular_module.data.journeyType.Channel[]} [channels]
  * @param {angular_module.data.journeyType.ObjectTransform[]} [objects]
  * @returns {angular_module.data.journeyType.Poi} this
  */
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

  /**
  *
  * @memberof angular_module.data.journeyType.Poi#
  * @function ToJson
  * @returns {object} json object
  */
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

  /**
  *
  * @memberof angular_module.data.journeyType.Poi#
  * @function FromJson
  * @param {object} json
  * @returns {angular_module.data.journeyType.Poi} this
  */
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

  /**
  *
  * @memberof angular_module.data.journeyType.Poi#
  * @function AddChannel
  * @param {angular_module.data.journeyType.PoiChannel} poi_channel
  * @returns {boolean} true if the channel is added, false otherwise. A channel is discarded if it is already present.
  */
  Poi.prototype.AddChannel = function(poi_channel) {
    var insert = !this.channels.find(function(elem) {
      return poi_channel.uuid === uuid;
    });

    if (insert) {
      poi.channels.push(poi_channel);
    }
    return insert;
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Poi#
  * @function AddObject
  * @param {angular_module.data.journeyType.ObjectTransform} object_transform
  * @returns {boolean} true
  */
  Poi.prototype.AddObject = function(object_transform) {
    this.objects.push(object_transform);
    return true;
  };

  /**
  * Creates a THREE.Object3D, representation of the bounds of the Poi, centered on his position, using CoordinatesConverterSvc.
  * @memberof angular_module.data.journeyType.Poi#
  * @function CreateBoundsObject
  * @returns {THREE.Object3D}
  */
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

  /**
  * Creates an object parent of the objects transformed of this POI, centered on the position of the POI, using CoordinatesConverterSvc.
  * @memberof angular_module.data.journeyType.Poi#
  * @function CreateScene
  * @param {Object.<THREE.Object3D>} objects
  * @returns {THREE.Object3D}
  */
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

  /**
  *
  * @memberof angular_module.data.journeyType.Poi#
  * @function Clear
  */
  Poi.prototype.Clear = function() {
    Data.prototype.Clear.call(this);
    this.latitude = 0;
    this.longitude = 0;
    this.radius = 10;
    this.channels.length = 0;
    this.objects.length = 0;
  };

  /**
  * Updates the ObjectTransform associated with each direct child of a THREE.Object3D.
  * @memberof angular_module.data.journeyType.Poi#
  * @function UpdateTransforms
  * @param {THREE.Object3D} object - Should be created by Poi.CreateScene function.
  */
  Poi.UpdateTransforms = function(object) {
    object.children.forEach(ObjectTransform.UpdateInnerTransform);
  };


  /**
  *
  * @class angular_module.data.journeyType.Journey
  * @memberOf angular_module.data.journeyType
  * @augments angular_module.data.journeyType.Data
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @param {Uuid[]} [pois]
  * @property {Uuid} uuid
  * @property {string} name
  * @property {Uuid[]} pois
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

  /**
  *
  * @memberof angular_module.data.journeyType.Journey#
  * @function Clear
  */
  Journey.prototype.Clear = function() {
    Data.prototype.Clear.call(this);
    this.pois.length = 0;
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Journey#
  * @function Set
  * @param {Uuid} [uuid]
  * @param {string} [name]
  * @param {Uuid[]} [pois]
  * @returns {angular_module.data.journeyType.Journey} this
  */
  Journey.prototype.Set = function(uuid, name, pois) {
    Data.prototype.Set.call(this, uuid, name);

    if (pois instanceof Array)
      this.pois = pois.slice(0);
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Journey#
  * @function ToJson
  * @returns {object} json object
  */
  Journey.prototype.ToJson = function() {
    var result = Data.prototype.ToJson.call(this);
    result.pois = this.pois.slice(0);
    return result;
  };

  /**
  *
  * @memberof angular_module.data.journeyType.Journey#
  * @function FromJson
  * @param {object} json
  * @returns {angular_module.data.journeyType.Journey} this
  */
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

  /**
  *
  * @memberof angular_module.data.journeyType.Journey#
  * @function AddPoi
  * @param {Uuid} uuid
  * @returns {boolean} true if the Poi was added, false otherwise, if already present.
  */
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
  * @class angular_module.data.journeyType.DataJourney
  * @memberOf angular_module.data.journeyType
  * @augments angular_module.data.journeyType.Data
  * @property {angular_module.data.journeyType.Journey} journey
  * @property {angular_module.data.journeyType.Poi[]} pois
  * @property {angular_module.data.journeyType.Channel[]} channels
  * @property {angular_module.data.journeyType.Marker[]} markers
  * @property {THREE.Object3D[]} objects
  */
  function DataJourney() {
    this.journey = new Journey();
    this.pois = {};
    this.channels = {};
    this.markers = {};
    this.objects = {};
  }

  /**
  *
  * @memberof angular_module.data.journeyType.DataJourney#
  * @function Clear
  */
  DataJourney.prototype.Clear = function() {
    this.journey.Clear();
    this.pois.length = 0;
    this.channels.length = 0;
    this.markers.length = 0;
    this.objects.length = 0;
  };

  /**
  *
  * @memberof angular_module.data.journeyType.DataJourney#
  * @function Set
  * @param {angular_module.data.journeyType.Journey} [journey]
  * @param {angular_module.data.journeyType.Poi[]} [pois]
  * @param {angular_module.data.journeyType.Channel[]} [channels]
  * @param {angular_module.data.journeyType.Marker[]} [markers]
  * @param {THREE.Object3D[]} [objects]
  */
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

  /**
  *
  * @memberof angular_module.data.journeyType.DataJourney#
  * @function ToJson
  * @returns {object} json object
  */
  DataJourney.prototype.ToJson = function() {
    return {
      journey:  this.journey.ToJson(),
      pois:     DataObjectToArray(this.pois),
      channels: DataObjectToArray(this.channels),
      markers:  DataObjectToArray(this.markers),
      objects:  ObjectsToJson(this.objects)
    };
  };

  /**
  *
  * @memberof angular_module.data.journeyType.DataJourney#
  * @function FromJson
  * @returns {Promise.<undefined, string>} A promise that resolves when the loading is complete.
  */
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