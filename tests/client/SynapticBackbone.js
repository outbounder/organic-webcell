var root = "../../";
var request = require("request");
var Cell = require(root+"WebCell");
var Chemical = require("organic").Chemical;

var cell;
var dnaData = {
  "membrane":{
    "HttpServer": {
      "logRoutes": true,
      "source": "membrane/ExpressHttpServer",
      "port": 8080,
      "staticFolder": "/tests/client/public",
      "routes": {
        "/": {
          "type": "RenderPage",
          "page": "/index",
        },
        "/code": {
          "type": "BundleCode",
          "code": "/index",
          "content-type": "text/javascript"
        }
      },
    },
    "MongoStore": {
      "source": "membrane/MongoStore",
      "dbname": "organic-webdata-test",
      "addons": [
        "membrane/mongoStoreAddons/MongoSynapse", 
      ]
    },
    "WebSocketServer": {
      "source": "membrane/WebSocketServer",
      "logLevel": 1,
      "attachToChemical": "HttpServer",
      "addons": [
        "membrane/socketioAddons/SocketioServerSynapse"
      ]
    }
  },
  "plasma": {
    "BundleCode": {
      "source": "plasma/BundleCode",
      "root": "/tests/client",
      "useCache": false,
      "debug": true
    },
    "RenderPage": {
      "source": "plasma/RenderPage",
      "root": "/tests/client",
      "useCache": false
    }
  }
};

var Backbone = require(root+"lib/SynapticBackbone");

var ServerModel = Backbone.Model.extend({
  idAttribute: "_id",
  url: "manualTest"
});

var HelloMessage = Backbone.Model.extend({
  url: "shareChannel"
});

var ServerCollection = Backbone.Collection.extend({
  model: ServerModel
});

cell = new Cell(dnaData);
cell.plasma.on("WebSocketServer", function(){

  Backbone.addModelSynapse("mongo", ServerModel, Backbone.MongoSynapse);
  Backbone.addModelSynapse("serverSocketio", ServerModel, Backbone.SocketioServerSynapse);

  ServerModel.serverSocketio.listen(function(){
    ServerModel.mongo.connect();  
    Backbone.addCollectionSynapse("socketio", ServerCollection, Backbone.SocketioServerSynapse);
    Backbone.addCollectionSynapse("mongo", ServerCollection, Backbone.MongoSynapse).connect();

    var serverCollection = new ServerCollection();
    serverCollection.on("add", function(m){
      console.log(m);
    });

    console.log("ALL STARTED");
  });

  Backbone.addModelSynapse("serverSocketio", HelloMessage, Backbone.SocketioServerSynapse);
  HelloMessage.serverSocketio.listen(function(){
    console.log("LISTENING ON NOT STORED CHANNEL");
  });

});

cell.plasma.on("socketConnection", function(){
  var helloMessage = new HelloMessage();
  helloMessage.save({message: "test me"},{success: function(){
    console.log("SEND HELLO MESSAGE");
    helloMessage.free();
  }});
});
