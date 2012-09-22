var Backbone = require("../../lib/SynapticBackbone");
var _ = require("underscore");

module.exports = function(config, httpServer) {

  var map = function(input){
    switch(input) {
      case "GET": return "read";
      case "POST": return "create";
      case "PUT": return "update";
      case "DELETE": return "delete";
    }
  }

  Backbone.ExpressServerSynapse = function(ModelClass, _config){
    this.ModelClass = ModelClass;
    this.config = _config || config;
  }

  Backbone.ExpressServerSynapse.prototype.init = function(mountPoint, collectionName){
    var self = this;
    httpServer.app.all(mountPoint, function(req, res, next){
      if(self.config.debug) console.log("expressServer:connection:recieve".red, req);
      var model = req.body || req.query;
      _.extend(model, {url: collectionName});
      var chem = {method: "create", model: model, options: {}};
      self.ModelClass.broadcast(chem, self, function(err, response){
        console.log("expressServer:broadcast:response".red, response);
        res.end(JSON.stringify(response));
      });
    });
  }
}