var Backbone = require("backbone");
require("../../utils/client/RealtimeMongoBackbone").attach(Backbone);
var WebCell = require("../../WebCell");
var _ = require("underscore");
var io = require("socket.io-client");

var dna = {
  "membrane": {
    "MongoStore": {
      "source": "membrane/MongoStore",
      "dbname": "organic-webdata-test"
    },
    "WebSocketServer": {
      "source": "membrane/WebSocketServer",
      "port": 8081,
      "logLevel": 1,
      "events": {
        "MongoStore": {
          "chain": ["MongoStore", "RealtimeMongoResource", "WebSocketServer"]
        },
        "RealtimeMongoResourceAdmin": {
          "chain": ["RealtimeMongoResourceAdmin", "WebSocketServer"]
        }
      }
    }
  },
  "plasma": {
    "RealtimeMongoResource": {
      "source": "plasma/RealtimeMongoResource"
    }
  }
}


var TestModel = Backbone.RealtimeModel.extend({
  idAttribute: "_id",
  collectionName: "test"
});
var TestModel2 = Backbone.RealtimeModel.extend({
  idAttribute: "_id",
  collectionName: "test"
});

var TestCollection1 = Backbone.RealtimeCollection.extend({
  model: TestModel,
  collectionName: "test"
});

describe("RealtimeBackbone", function(){

  var cell;
  var secondConnection;
  var testModel1;
  var testModel2;
  var testModel3;
  var testCollection1;

  it("should have server started", function(next){
    cell = new WebCell(dna);
    cell.plasma.once("WebSocketServer", function(){
      next();
    });
  });

  it("should be able to connect", function(next){
    Backbone.realtime.connect("http://localhost:8081", function(){
      next();
    });
  });

  it("should create two models in db", function(next){
    testModel1 = new TestModel();
    testModel1.on("change", _.once(function(){
      expect(testModel1.id).toBeDefined();
      next();
    }));
    testModel1.save();
  });

  it("should be able to connect as second user", function(next){
    secondConnection = io.connect("http://localhost:8081", {
      "force new connection": true
    });
    secondConnection.on("connect", function(){
      next();
    });
  });

  it("should be able to fetch model1 as second user", function(next){
    testModel2 = new TestModel2();
    testModel2.id = testModel1.id;
    testModel2.useConnection(secondConnection);
    testModel2.on("change", _.once(function(){
      expect(testModel2.id).toBeDefined();
      expect(testModel2.id).toBe(testModel1.id);
      next();
    }));
    testModel2.fetch();
  });

  it("should be able to change model1 as second user and trigger valid change in model1", function(next){
    testModel1.on("change", _.once(function(){
      expect(testModel1.get('title')).toBe("test");
      expect(testModel2.get('title')).toBe("test");
      next();
    }));
    testModel2.save({title: "test"}, {wait: true});
  });

  it("should be able to fetch all Models in collection", function(next){
    testCollection1 = new TestCollection1();
    testCollection1.on("reset", _.once(function(){
      expect(testCollection1.get(testModel1.id)).toBeDefined();
      next();
    }));
    testCollection1.fetch();
  });

  it("should be able to create new model as second user and trigger add event on the collection", function(next){
    testModel3 = new TestModel({title: "testValue"});
    testCollection1.on("add", _.once(function(){
      expect(testCollection1.get(testModel3.id)).toBeDefined();
      next();
    }));
    testModel3.useConnection(secondConnection);
    testModel3.save();
  });

  it("should be able to update model within collection as second user and trigger change event on the collection", function(next){
    testCollection1.on("change", _.once(function(){
      expect(testCollection1.get(testModel3.id)).toBeDefined();
      expect(testCollection1.get(testModel3.id).get('title')).toBe("changedTestValue");
      next();
    }));
    testModel3.save({title: "changedTestValue"});
  });

  it("should be able to fetch Models in Collection by pattern", function(next){
    testCollection1 = new TestCollection1();
    testCollection1.on("reset", _.once(function(){
      expect(testCollection1.get(testModel3.id)).toBeDefined();
      next();
    }));
    testCollection1.fetch({pattern: {title: "changedTestValue"}});
  });

  it("should receive notifications only for the collection with pattern", function(next){
    var testCollection = new TestCollection1();
    testCollection.on("reset", _.once(function(){
      testCollection1.on("change", _.once(function(){
        expect(testCollection1.get(testModel3.id)).toBeDefined();
        expect(testCollection1.get(testModel3.id).get("baitle")).toBe("test");
        next();
      }));
      testModel3.save({baitle: "test"});
    }));
    testCollection.on("change", _.once(function(){
      next(new Error("SHOULD NOT HAPPEN"));
    }));
    testCollection.fetch({pattern: {title: "testValue"}});
  });

  it("should delete model and collection should receive notification about it", function(next){
    testCollection1.on("remove", _.once(function(){
      expect(testCollection1.get(testModel3.id)).toBeUndefined();
      next();
    }));
    testModel3.destroy();
  });

  it("should not send notifications on model once its realtime is disabled", function(next){
    var m1 = new TestModel({title: "m1"});
    m1.on("change", _.once(function(){
      expect(m1.id).toBeDefined();
      expect(m1.id.length).toBe(24);

      var m2 = new TestModel({_id: m1.id});
      m2.useConnection(secondConnection);
      m2.on("change", _.once(function(){
        expect(m2.id).toBe(m1.id);
        expect(m2.get('title')).toBe("m1");

        m1.disableRealtime();
        m1.on("change", function(){
          next(new Error("SHOULD NOT HAPPEN"));
        })
        m2.on("change", _.once(function(){
          expect(m2.get('title')).toBe("m2");
          next();
        }));
        m2.save({title: "m2"});
      }));
      m2.fetch();
    }));
    m1.save();
  });

  it("should not send notifications on collection once its realtime is disabled", function(next){
    var c1 = new TestCollection1();
    c1.on("reset", function(){
      c1.on("add", function(){
        next(new Error("should not happen"));
      });
      c1.disableRealtime(function(){
        var m1 = new TestModel();
        m1.useConnection(secondConnection);
        m1.on("change", function(){
          expect(m1.id).toBeDefined();
          next();
        });
        m1.save();
      });
    });
    c1.fetch();
  });

  it("should kill the cell", function(){
    Backbone.realtime.disconnect();
    secondConnection.disconnect();
    cell.kill();
  });
});