var Backbone = require("backbone");
var _ = require("underscore");

var config = {
  debug: true
}


Backbone.addModelSynapse = function(name, Model, Synapse) {
  require("./synapsizeModel")(name, Model, Synapse, config);
}

Backbone.addCollectionSynapse = function(name, Model, Synapse) {
  require("./synapsizeCollection")(name, Model, Synapse, config); 
}

module.exports = function(_config){
  _.extend(config, _config);
}