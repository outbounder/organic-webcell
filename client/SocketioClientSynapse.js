var io = require("socket.io-client");
var _ = require("underscore");

var SocketioClientSynapse = function(ModelClass, config){
  this.ModelClass = ModelClass;
  this.config = config;
}

SocketioClientSynapse.prototype.connect = function(target, connectCallback) {
  var self = this;
  this.connection = io.connect(target);
  this.connection.on("connect", function(){
    
    self.ModelClass.on("broadcast", function(chemical, sender, callback){
      if(self.config.debug) console.log("client:connection:emit".red, self.config.debugData?chemical.toJSON():"");
      this.connection.emit("backbone:model:broadcast", chemical.toJSON(), function(err, response){
        if(self.config.debug) console.log("client:connection:emit:response".red, err, response);
        callback(err, response);
      });
    }, self);

    self.connection.on("backbone:model:broadcast", function(chemical, callback){
      if(self.config.debug) console.log("client:connection:receive".red, chemical);
      self.ModelClass.broadcast(chemical, self, callback);
    });

    if(connectCallback) connectCallback();

  });
}
SocketioClientSynapse.prototype.disconnect = function(){
  this.connection.disconnect();
}

module.exports.attach = function(Backbone){
  Backbone.SocketioClientSynapse = SocketioClientSynapse;
}