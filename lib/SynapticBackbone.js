var Backbone = require("backbone");
var _ = require("underscore");

var config = {
  debug: false
}


Backbone.addSynapse = function(name, Model, synapse) {
  Model.prototype.$sync = Model.prototype.sync;
  Model.prototype.$initliaze = Model.prototype.initliaze;
  require("./synapsizeModel")(name, Model, synapse, config);
}

module.exports = function(_config){
  _.extend(config, _config);
}