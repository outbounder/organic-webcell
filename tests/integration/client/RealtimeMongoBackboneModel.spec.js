var root = "../../../";
var Backbone = require("backbone");

var WebCell = require(root+"WebCell");
var _ = require("underscore");

var dna = {
  "membrane": {
    "MongoStore": {
      "source": "membrane/MongoStore",
      "dbname": "organic-webdata-test"
    },
    "WebSocketServer": {
      "source": "membrane/WebSocketServer",
      "port": 8083,
      "socketio": {
        "close timeout": 1
      },
      "events": {
        "MongoStore": {
          "chain": ["MongoStore", "WebSocketServer"]
        }
      }
    }
  }
}

describe("RealtimeBackboneModel", function(){
  var cell;
  var Model;
  var instance;
  var realtime;

  it("should have server started", function(next){
    cell = new WebCell(dna);
    cell.plasma.on("WebSocketServer", function(){
      next();
    });
  });

  it("should be able to connect", function(next){
    realtime = require(root+"utils/client/RealtimeMongoBackbone").attach(Backbone);
    realtime.connect("http://localhost:8083", function(){
      next();
    });
  });

  it("should be able to extend RealtimeModel", function(){
    Model = Backbone.RealtimeModel.extend({
      idAttribute: "_id",
      collectionName: "test"
    });
  });

  it("should be able to create instance of RealtimeModel", function(){
    instance = new Model();
  });

  it("should be able to save instance", function(next){
    instance.on("change", _.once(function(){
      expect(instance.id).toBeDefined();
      expect(instance.id.length).toBe(24);
      expect(instance.get("title")).toBe("value");
      next();
    }));
    instance.save({title: "value"}, {wait: true});
  });

  it("should be able to fetch instance", function(next){
    var newInstance = new Model();
    newInstance.id = instance.id;
    newInstance.on("change", _.once(function(){
      expect(newInstance.id).toBe(instance.id);
      expect(newInstance.get("title")).toBe(instance.get("title"));
      next();
    }));
    newInstance.fetch();
  });

  it("should be able to update instance", function(next){
    instance.on("change", _.once(function(){
      expect(instance.id).toBeDefined();
      expect(instance.id.length).toBe(24);
      expect(instance.get("title")).toBe("value2");
      next();
    }));
    instance.save({title: "value2"}, {wait: true});
  });

  it("should be able to remove instance", function(next){
    instance.on("destroy", _.once(function(){
      next();
    }));
    instance.destroy({wait: true});
  });

  it("should kill the cell", function(){
    realtime.disconnect();
    cell.kill();
  });
});