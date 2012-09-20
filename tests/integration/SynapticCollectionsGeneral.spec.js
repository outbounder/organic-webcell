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
      "port": 9061,
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
      url: "synapticTest5",
      idAttribute: "_id"
    });
    models.ClientCollection = Backbone.Collection.extend({
      model: models.ClientModel
    });

    models.ServerModel = Backbone.Model.extend({
      url: "synapticTest5",
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
    Backbone.addModelSynapse("socketio", models.ServerModel, Backbone.SocketioServerSynapse);

    models.ServerModel.socketio.listen(function(){
      models.ServerModel.mongo.connect();  
      Backbone.addCollectionSynapse("socketio", models.ServerCollection, Backbone.SocketioServerSynapse);
      Backbone.addCollectionSynapse("mongo", models.ServerCollection, Backbone.MongoSynapse).connect();
      tryNext();
    });
    
    // < -- socketio events -- >

    Backbone.addModelSynapse("socketio", models.ClientModel, Backbone.SocketioClientSynapse);
    Backbone.addModelSynapse("memory", models.ClientModel, Backbone.MemorySynapse);

    models.ClientModel.socketio.connect("http://localhost:"+dna.membrane.WebSocketServer.port, function(){
      models.ClientModel.memory.init();
      Backbone.addCollectionSynapse("socketio", models.ClientCollection, Backbone.SocketioClientSynapse);
      tryNext();
    });
  });

  it("creates server collection and fetches all records", function(next){
    var serverCollection = new models.ServerCollection();
    serverCollection.pattern = {};
    serverCollection.fetch({success: function(){
      serverCollection.free();
      next();
    }});
  });

  it("creates new model in client and fetches it from server", function(next){
    var clientModel = instances.clientModel = new models.ClientModel();
    clientModel.once("change", function(){
      var serverCollection = new models.ServerCollection();
      serverCollection.pattern = {title: "test"};
      serverCollection.fetch({success:function(){
        serverCollection.free();
        expect(serverCollection.length).toBe(1);
        instances.clientModel.on("destroy", function(){
          instances.clientModel.free();
          next();
        });
        instances.clientModel.destroy({wait: true});
      }});
      next();
    });
    clientModel.save({title: "test"},{wait: true});
  });

  it("creates new server model and client fetches it", function(next){
    var serverModel = new models.ServerModel();
    serverModel.on("change", function(){
      expect(serverModel.id).toBeDefined();
      var clientCollection = new models.ClientCollection();
      clientCollection.pattern = {_id: serverModel.id};
      clientCollection.on("add", function(m){
        expect(m.id).toBe(serverModel.id);
        next();
      });
      clientCollection.fetch();
    });
    serverModel.save({title: "take me"},{wait: true});
  });

  it("fetches everything from db and deletes all", function(next){
    var serverCollection = new models.ServerCollection();
    serverCollection.pattern = {};
    serverCollection.fetch({success: function(){
      expect(serverCollection.length != 0).toBe(true);
      serverCollection.each(function(m){
        m.destroy();
      });
      next();
    }});
  });

  it("checks that server is empty from clientCollection", function(next){
    var clientCollection = new models.ClientCollection();
    clientCollection.pattern = {};
    clientCollection.fetch({success: function(){
      expect(clientCollection.length).toBe(0);
      next();
    }});
  });

  it("should kill the cell", function(){
    models.ClientModel.socketio.disconnect();
    secondConnection.disconnect();
    cell.kill();
  });
});