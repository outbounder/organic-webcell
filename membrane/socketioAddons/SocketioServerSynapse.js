var Backbone = require("../../lib/SynapticBackbone");
var _ = require("underscore");

module.exports = function(owner, config) {

  Backbone.SocketioServerSynapse = function(ModelClass, _config){
    this.ModelClass = ModelClass;
    this.config = _config || config;
  }

  Backbone.SocketioServerSynapse.prototype.listen = function(connectCallback){
    var self = this;
    owner.server.sockets.on('connection', function(connection){

      var broadcast = function(chemical, sender, callback) {
        if(self.config.debug) console.log("server:connection:emit:".red, chemical);
        connection.emit("backbone:model:broadcast", chemical, function(err, response){
          if(self.config.debug) console.log("server:connection:emit:result".red, err, response);
          callback(err, response);
        });
      }

      connection.on("backbone:model:broadcast", function(chemical, callback){
        if(self.config.debug) console.log("server:connection:recieve".red, chemical);
        self.ModelClass.broadcast(chemical, self, callback);
      });

      self.ModelClass.on("broadcast", broadcast, self);

      connection.on("disconnect", function(){
        self.ModelClass.off("broadcast", broadcast)
      });
    });

    if(connectCallback) connectCallback();
  }
}