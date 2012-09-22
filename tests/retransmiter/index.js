var Backbone = require("../../lib/SynapticBackbone");
require("../../client/SocketioClientSynapse").attach(Backbone);
require("../../client/MemorySynapse").attach(Backbone);

var IncomingModel = Backbone.Model.extend({
  url: "synapticTest",
  idAttribute: "_id"
});

var IncomingChannel = Backbone.Collection.extend({
  model: IncomingModel
});

Backbone.addModelSynapse("clientSocketio", IncomingModel, Backbone.SocketioClientSynapse);
Backbone.addModelSynapse("memory", IncomingModel, Backbone.MemorySynapse);
Backbone.addCollectionSynapse("clientSocketio", IncomingChannel, Backbone.SocketioClientSynapse);

IncomingModel.clientSocketio.connect("http://localhost:8080", function(){
  IncomingModel.memory.init();
  console.log("CONNECTED");

  var incomingChannel = new IncomingChannel();
  incomingChannel.on("add", function(m){
    console.log("ON RECEIVE", m);
  });
});