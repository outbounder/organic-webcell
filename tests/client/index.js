var Backbone = require("../../lib/SynapticBackbone");
require("../../client/SocketioClientSynapse").attach(Backbone);
require("../../client/MemorySynapse").attach(Backbone);

var ClientModel = Backbone.Model.extend({
  url: "synapticTest",
  idAttribute: "_id"
});

Backbone.addModelSynapse("clientSocketio", ClientModel, Backbone.SocketioClientSynapse);
Backbone.addModelSynapse("memory", ClientModel, Backbone.MemorySynapse);

var HelloMessage = Backbone.Model.extend({
  url: "shareChannel"
});

var HelloChannel = Backbone.Collection.extend({
  model: HelloMessage
});

Backbone.addModelSynapse("clientSocketio", HelloMessage, Backbone.SocketioClientSynapse).connect("http://localhost:8080")
Backbone.addModelSynapse("memory", HelloMessage, Backbone.MemorySynapse);
Backbone.addCollectionSynapse("clientSocketio", HelloChannel, Backbone.SocketioClientSynapse);

ClientModel.clientSocketio.connect("http://localhost:8080", function(){
  ClientModel.memory.init();
  console.log("CONNECTED");

  var clientModel = new ClientModel();
  clientModel.on("change", function(){
    console.log("ON SAVE", clientModel);
  });
  clientModel.save({test: "save me please"}, {wait: true});

  var helloChannel = new HelloChannel();
  helloChannel.on("add", function(m){
    console.log("ON RECEIVE", m);
  });
});