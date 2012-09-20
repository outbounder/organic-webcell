var Backbone = require("backbone");
var _ = require("underscore");

var config = {
  debug: false,
  debugData: false
}


Backbone.addModelSynapse = function(name, Model, Synapse) {
  require("./synapsizeModel")(name, Model, Synapse, config);
  return Model[name];
}

Backbone.addCollectionSynapse = function(name, Model, Synapse) {
  require("./synapsizeCollection")(name, Model, Synapse, config); 
  return Model[name];
}

module.exports = Backbone; // always returns same Backbone 