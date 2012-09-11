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
      "port": 8082,
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

describe("RealtimeBackboneCollection", function(){
  var cell;
  var realtime;
  
  var Model;
  var Collection;
  
  var collection;
  var model;

  it("should have server started", function(next){
    cell = new WebCell(dna);
    cell.plasma.on("WebSocketServer", function(){
      next();
    });
  });

  it("should be able to connect", function(next){
    realtime = require(root+"utils/client/RealtimeMongoBackbone").attach(Backbone);
    realtime.connect("http://localhost:8082", function(){
      next();
    });
    Model = Backbone.RealtimeModel.extend({
      collectionName: "test"
    });
    Collection = Backbone.RealtimeCollection.extend({
      model: Model,
      collectionName: "test"
    });
  });

  it("should be able to save new model", function(next){
    model = new Model({title: "value"});
    model.on("change", _.once(function(){
      expect(model.id).toBeDefined();
      expect(model.id.length).toBe(24);
      expect(model.get("title")).toBe("value");
      next();
    }));
    model.save();
  });

  it("should be able to fetch models into collection", function(next){
    collection = new Collection();
    collection.on("reset", function(){
      expect(collection.get(model.id)).toBeDefined();
      next();
    });
    collection.fetch();
  });

  it("should be able to fetch models into collection by pattern", function(next){
    model = new Model({title: "value2"});
    model.on("change", _.once(function(){
      expect(model.id).toBeDefined();
      expect(model.id.length).toBe(24);
      expect(model.get("title")).toBe("value2");
      
      collection = new Collection();
      collection.on("reset", function(){
        expect(collection.get(model.id)).toBeDefined();
        next();
      });
      collection.fetch({pattern: {title: "value2"}});
    }));
    model.save();
  });

  it("should kill the cell", function(){
    realtime.disconnect();
    cell.kill();
  });
});