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
      "middleware": [
        "membrane/expressMiddleware/ExpressServerSynapse"
      ],
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
      "root": "/tests/retransmiter",
      "useCache": false,
      "debug": true
    },
    "RenderPage": {
      "source": "plasma/RenderPage",
      "root": "/tests/retransmiter",
      "useCache": false
    }
  }
};

var Backbone = require(root+"lib/SynapticBackbone");

var ServerModel = Backbone.Model.extend({
  idAttribute: "_id",
  url: "manualTest"
});

cell = new Cell(dnaData);
cell.plasma.on("WebSocketServer", function(){

  Backbone.addModelSynapse("serverHttp", ServerModel, Backbone.ExpressServerSynapse);
  Backbone.addModelSynapse("serverSocketio", ServerModel, Backbone.SocketioServerSynapse);

  ServerModel.serverSocketio.listen(function(){
    ServerModel.serverHttp.init("/emit", "manualTest");
    console.log("running...".green);
  });
});