var root = "../../";
var Backbone = require("backbone");
require("backbone-callbacks").attach(Backbone);
require(root+"lib/SynapticBackbone");
require(root+"client/SocketioClientSynapse").attach(Backbone);
require(root+"client/MemorySynapse").attach(Backbone);

var WebCell = require(root+"WebCell");
var _ = require("underscore");
var io = require("socket.io-client");

var dna = {
  "membrane": {
    "MongoStore": {
      "source": "membrane/MongoStore",
      "dbname": "organic-webdata-test",
      "addons": [
        "membrane/mongoStoreAddons/MongoSynapse", 
      ]
    },
    "WebSocketServer": {
      "source": "membrane/WebSocketServer",
      "port": 9081,
      "logLevel": 1,
      "addons": [
        "membrane/socketioAddons/SocketioServerSynapse"
      ]
    }
  },
  "plasma": {}
}


describe("SynapticBackbone", function(){

  var cell;
  var secondConnection;
  var models = {};
  var instances = {};


  it("should have server started", function(next){
    cell = new WebCell(dna);
    cell.plasma.once("WebSocketServer", function(){
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

  it("creates defines some models", function(){
    models.ClientModel = Backbone.Model.extend({
      url: "synapticTest",
      idAttribute: "_id"
    });
    models.ClientCollection = Backbone.Collection.extend({
      model: models.ClientModel
    });

    models.ServerModel = Backbone.Model.extend({
      url: "synapticTest",
      idAttribute: "_id"
    });
    models.ServerCollection = Backbone.Collection.extend({
      model: models.ServerModel
    });
  });

  it("creates synapses between server and client models", function(next){
    var count = 0;
    var tryNext = function(){
      count += 1;
      if(count == 2)
        next();
    }

    Backbone.addSynapse("mongo", models.ServerModel, Backbone.MongoSynapse);
    Backbone.addSynapse("socketio", models.ServerModel, Backbone.SocketioServerSynapse);

    models.ServerModel.socketio.listen(function(){
      models.ServerModel.mongo.connect();  
      tryNext();
    });
    
    // < -- socketio events -- >

    Backbone.addSynapse("socketio", models.ClientModel, Backbone.SocketioClientSynapse);

    models.ClientModel.socketio.connect("http://localhost:"+dna.membrane.WebSocketServer.port, function(){
      tryNext();
    });
  });

  //* PART ONE *//

  describe("PART ONE", function(){

    it("creates new client model", function(next){
      var clientModel = instances.clientModel = new models.ClientModel();
      clientModel.on("change", function(){
        expect(clientModel.get("title")).toBe("value");
        expect(clientModel.id).toBeDefined();
        clientModel.free();
        next();
      })
      clientModel.save({title: "value"}, {wait: true});
    });

    it("fetches new client model", function(next){
      var clientModel = instances.clientModel = new models.ClientModel({_id: instances.clientModel.id});
      clientModel.once("change", function(){
        expect(clientModel.get("title")).toBe("value");
        expect(clientModel.id).toBeDefined();
        next();
      });
      clientModel.fetch();
    });

    it("updataes last client model", function(next){
      var clientModel = instances.clientModel;
      clientModel.once("change", function(){
        expect(clientModel.get("title")).toBe("value2");
        expect(clientModel.id).toBeDefined();
        clientModel.free();
        next();
      });
      clientModel.save({title: "value2"}, {wait: true});
    });

    it("removes last client model", function(next){
      var clientModel = instances.clientModel;
      clientModel.once("destroy", function(){
        expect(clientModel.get("title")).toBe("value2");
        expect(clientModel.id).toBeDefined();
        clientModel.free();
        next();
      });
      clientModel.destroy();
    });
  });

  //* PART TWO *//

  describe("PART TWO", function(){
    
    it("saves instance of server model and client instance gets change event", function(next){
      var serverModel = instances.serverModel = new models.ServerModel();
      serverModel.once("change", function(){
        expect(serverModel.id).toBeDefined();
        var clientModel = instances.clientModel = new models.ClientModel({_id: serverModel.id});
        serverModel.once("change", function(){
          expect(serverModel.get("title")).toBe(clientModel.get("title"));
          next();
        });
        clientModel.save({title: "2"}, {wait: true});
      });
      serverModel.save({title: "1"}, {wait: true});
    });

    xit("notifies client model once server is updated", function(next){
      instances.clientModel.once("change", function(){
        expect(instances.clientModel.get("title")).toBe(instances.serverModel.get("title"));
        next();
      });
      instances.serverModel.once("change", function(){
        console.log("HHHH".green);
      });
      instances.serverModel.save({title: "3"}, {wait: true});
    });

    it("notifies all instances of server model once client model is destroyed", function(next){
      var count = 0;
      var tryNext = function(){
        count += 1;
        if(count == 2) next();
      }

      var secondServerModel = new models.ServerModel({_id: instances.serverModel.id });
      secondServerModel.once("destroy", function(){
        tryNext();
      });
      instances.serverModel.once("destroy", function(){
        tryNext();
      });
      instances.clientModel.destroy();
    });
  });

  it("should kill the cell", function(){
    models.ClientModel.socketio.disconnect();
    secondConnection.disconnect();
    cell.kill();
  });
});