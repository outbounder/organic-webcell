var Backbone = require("backbone");
var _ = require("underscore");

var config = {
  debug: false
}


Backbone.addSynapse = function(name, Model, synapse) {
  require("./synapseModel")(name, Model, synapse, config);
}

module.exports = function(_config){
  _.extend(config, _config);
}