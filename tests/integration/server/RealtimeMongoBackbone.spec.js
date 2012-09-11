var root = "../../../";
var Backbone = require("backbone");
require("backbone-callbacks").attach(Backbone);

var WebCell = require(root+"WebCell");
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
      "port": 9081,
      "logLevel": 1,
      "events": {
        "MongoStore": {
          "chain": ["MongoStore", "RealtimeMongoResource", "WebSocketServer"]
        },
        "RealtimeMongoResourceAdmin": {
          "chain": ["RealtimeMongoResourceAdmin", "WebSocketServer"]
        },
        "test": {
          "chain": ["CustomActionCreate", "WebSocketServer"]
        },
        "testUpdate": {
          "chain": ["CustomActionUpdate", "WebSocketServer"]
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


describe("RealtimeMongoBackbone", function(){

  var cell;
  var secondConnection;
  var TestClientModel;
  var TestClientCollection;
  var TestServerModel;

  var lastModelId;
  var realtime;


  it("should have server started", function(next){
    cell = new WebCell(dna);

    cell.plasma.on("CustomActionUpdate", function(c){
      var serverModel = new TestServerModel({_id: c.data.id});
      serverModel.save({title: c.data.title}, function(data){
        c.type = c.chain.shift();
        c.data = data;
        cell.plasma.emit(c);
      });
    });

    cell.plasma.on("CustomActionCreate", function(c){
      var serverModel = new TestServerModel();
      serverModel.save(c.data, function(err, data){
        c.type = c.chain.shift();
        c.data = data;
        cell.plasma.emit(c);
      });
    });

    cell.plasma.once("WebSocketServer", function(){
      realtime = require(root+"utils/client/RealtimeMongoBackbone").attach(Backbone);
      require(root+"utils/server/MongoBackbone").attach(Backbone, cell.plasma, {
        chain: ["MongoStore", "RealtimeMongoResource", "MongoBackbone"]
      });

      TestClientModel = Backbone.RealtimeModel.extend({
        collectionName: "test"
      });

      TestClientCollection = Backbone.RealtimeCollection.extend({
        collectionName: "test",
        model: TestClientModel
      });

      TestServerModel = Backbone.MongoModel.extend({
        collectionName: "test"
      });

      next();
    });
  });

  it("should be able to connect", function(next){
    realtime.connect("http://localhost:"+dna.membrane.WebSocketServer.port, function(){
      next();
    });
  });

  it("should be able to connect as second user", function(next){
    secondConnection = io.connect("http://localhost:"+dna.membrane.WebSocketServer.port, {
      "force new connection": true
    });
    secondConnection.on("connect", function(){
      next();
    });
  });

  it("should be able emit custom event and receive test server model data", function(next){
    secondConnection.emit("test", {"title": "value"}, function(err, data){
      expect(data._id).toBeDefined();
      next();
    });
  });

  it("should be able create ClientTestCollection and receive new models", function(next){
    var testCollection = new TestClientCollection();
    testCollection.on("add", _.once(function(m){
      expect(m.id).toBeDefined();
      expect(m.get("title")).toBe("value");
      lastModelId = m.id;
      next();
    }));
    testCollection.on("reset", _.once(function(){
      secondConnection.emit("test", {"title": "value"});
    }));
    testCollection.fetch();
  });

  it("should be able to fetch TestClientModel and recieve change events on it", function(next){
    var testModel = new TestClientModel({_id: lastModelId});
    testModel.on("change", _.once(function(){
      expect(testModel.id).toBeDefined();
      expect(testModel.get("title")).toBe("value");

      testModel.on("change:title", _.once(function(){
        expect(testModel.get("title")).toBe("value2");
        next();
      }));

      secondConnection.emit("testUpdate", {id: testModel.id, "title": "value2"});
    }));
    testModel.fetch();
  });

  it("fetch TestClientModel and TestServerModel and recieve change events in server from client", function(next){
    var testClientModel = new TestClientModel({_id: lastModelId});
    testClientModel.on("change", _.once(function(){
      var testServerModel = new TestServerModel({_id: lastModelId});
      testServerModel.on("change", _.once(function(){
        testServerModel.on("change:title", _.once(function(){
          expect(testServerModel.get("title")).toBe("value3");
          next();
        }));
        testClientModel.save({title: "value3"});
      }));
      testServerModel.fetch();
    }));
    testClientModel.fetch();
  });

  it("should kill the cell", function(){
    realtime.disconnect();
    secondConnection.disconnect();
    cell.kill();
  });
});