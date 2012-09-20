var root = "../../";

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
      "port": 9071,
      "logLevel": 1,
      "addons": [
        "membrane/socketioAddons/SocketioServerSynapse"
      ]
    }
  },
  "plasma": {}
}


describe("SynapticBackbone", function(){

  var Backbone = require(root+"lib/SynapticBackbone");
  require(root+"client/SocketioClientSynapse").attach(Backbone);
  require(root+"client/MemorySynapse").attach(Backbone);

  var WebCell = require(root+"WebCell");
  var _ = require("underscore");
  var io = require("socket.io-client");


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

    Backbone.addModelSynapse("mongo", models.ServerModel, Backbone.MongoSynapse);
    Backbone.addModelSynapse("serverSocketio", models.ServerModel, Backbone.SocketioServerSynapse);

    models.ServerModel.serverSocketio.listen(function(){
      models.ServerModel.mongo.connect();  
      tryNext();
    });
    
    // < -- socketio events -- >

    Backbone.addModelSynapse("clientSocketio", models.ClientModel, Backbone.SocketioClientSynapse);
    Backbone.addModelSynapse("memory", models.ClientModel, Backbone.MemorySynapse);

    models.ClientModel.clientSocketio.connect("http://localhost:"+dna.membrane.WebSocketServer.port, function(){
      models.ClientModel.memory.init();
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

  it("should kill the cell", function(){
    models.ClientModel.clientSocketio.disconnect();
    secondConnection.disconnect();
    cell.kill();
  });
});