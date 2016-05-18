angular.module('data')

.factory('journeyTypes', [function() {

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
    Data.Set.call(this, uuid, name || 'unnamed marker');

    this.type = type || 'img',
    this.url = url || '',
    this.tag_id = tag_id;

    return this;
  };

  Marker.prototype.ToJson = function() {
    var result = Data.ToJson.call(this);

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
    this.Set.apply(this, arguments);
  }

  Channel.prototype = Object.create(Data.prototype);
  Channel.prototype.constructor = Channel;

  Channel.prototype.Set = function(uuid, name, marker, contents) {
    Data.Set.call(this, uuid, name);

    this.marker = marker;
    this.contents = contents.slice(0);
    return this;
  };

  Channel.prototype.AddContent = function(object_transform) {
    this.contents.push(object_transform);
    return this;
  };

  Channel.prototype.ToJson = function() {
    var result = Data.ToJson.call(this);

    result.marker = this.marker;
    result.contents = this.contents.map(function(c) {
      return c.ToJson();
    });

    return result;
  };

  Channel.prototype.FromJson = function(json) {
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


  /**
  *
  * @param {Uuid} [uuid]
  */
  function PoiChannel(uuid) {
    this.uuid = uuid;
  }

  PoiChannel.prototype.ToJson = function() {
    return {
      uuid: this.uuid;
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

    this.channels = channels.filter(function(c, index) {
      var valid = (typeof c.uuid !== 'undefined');
      if (!valid)
        console.warn('Poi: cant add PoiChannel ' + index + ': uuid undefined');
      return valid;
    })
    .map(function(c) {
      return new PoiChannel(c.uuid);
    });

    this.objects = objects.filter(function(o, index) {
      var valid = (typeof o.uuid !== 'undefined');
      if (!valid)
        console.warn('Poi: cant add ObjectTranform ' + index + ': uuid undefined');
      return valid;
    })
    .map(function(o) {
      return new ObjectTransform(o.uuid, o.name, o.position, o.rotation, o.scale);
    });
  }

  Poi.prototype = Object.create(Data.prototype);
  Poi.prototype.constructor = Poi;

  Poi.prototype.Set = function(uuid, name, latitude, longitude, radius, channels, objects) {
    Data.Set.call(this, uuid, name);

    this.latitude = latitude || 0;
    this.longitude = longitude || 0;
    this.radius = radius || 10;

    if (channels instanceof Array)
      this.channels = channels.slice(0);
    if (objects instanceof Array)
      this.objects = objects.slice(0);
    return this;
  };

  Poi.prototype.ToJson = function() {
    var result = Data.ToJson.call(this);

    result.latitude = this.latitude;
    result.longitude = this.longitude;
    result.radius = this.radius;
    result.channels = this.channels.map(function(c) {
      return c.ToJson();
    });
    result.objects = this.objects.map(function(o) {
      return o.ToJson();
    });
  };

  Poi.prototype.FromJson = function(json) {
    var channels = [];
    var objects = [];

    if (typeof json.channels !== 'undefined') {
      if (json.channels instanceof Array) {
        channels = json.channels.filter(new DataFilter('PoiChannel')).map(function(e) {
          return (new PoiChannel).FromJson(e);
        });
      }
      else
        console.warn('failed to add POI channels: not an array');
    }
    if (typeof json.objects !== 'undefined') {
      if (json.objects instanceof Array) {
        objects = json.objects;
      }
      else
        console.warn('failed to add POI objects: not an array');
    }

    this.Set(json.uuid, json.name, json.latitude, json.longitude, json.radius, channels, objects);

    return this;
  };

  Poi.prototype.AddChannel = function(poi_channel) {
    var found = this.channels.find(function(elem) {
      return poi_channel.uuid === uuid;
    });

    if (!found) {
      poi.channels.push(poi_channel);
    }
    return !found;
  };

  Poi.prototype.AddObject = function(object_transform) {
    this.objects.push(object_transform);
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
  };

  Journey.prototype = Object.create(Data.prototype);
  Journey.prototype.constructor = Journey;

  Journey.prototype.Set = function(uuid, name, pois) {
    Data.Set.call(this, uuid, name);

    if (pois instanceof Array)
      this.pois = pois.slice(0);
  };

  Journey.prototype.ToJson = function() {
    var result = Data.ToJson.call(this);
    result.pois = this.pois.slice(0);
    return result;
  };

  Journey.prototype.FromJson = function(json) {
    var pois = [];
    if (typeof json.pois !== 'undefined') {
      if (json.pois instanceof Array) {
        pois = json.pois.filter(new DataFilter('POI')).map(function(e) {
          return (new Poi()).FromJson(e);
        });
      }
      else
        console.warn('failed to add POIs: not an array');
    }
    this.Set(json.uuid, json.name, pois);
  };


  function DataFilter(type) {
    return function(e, index) {
      var valid = (typeof e.uuid === 'string');
      if (!valid)
        console.warn('failed to add ' + type + ' ' + index + ': no uuid provided');
      return valid;
    };
  }

  /**
  *
  */
  function DataJourney() {
    this.journey = new Journey();
    this.pois = [];
    this.channels = [];
    this.markers = [];
    this.objects = [];
  }

  DataJourney.prototype.Set = function(journey, pois, channels, markers, objects) {
    if (typeof journey !== 'undefined')
      this.journey.Set(journey.uuid, journey.name, journey.pois);
    if (pois instanceof Array)
      this.pois = pois.slice(0);
    if (channels instanceof Array)
      this.channels = channels.slice(0);
    if (markers instanceof Array)
      this.markers = markers.slice(0);
    if (objects instanceof Array)
      this.objects = objects.slice(0);
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
    ObjectTransform: ObjectTransform,
    PoiChannel: PoiChannel,
    Marker: Marker,
    Channel: Channel,
    Poi: Poi,
    Journey: Journey,
    DataJourney: DataJourney
  };

}]);