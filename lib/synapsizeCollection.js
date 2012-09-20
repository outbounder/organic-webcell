var Chemical = require("./Chemical");

module.exports = function(name, Collection, Synapse, config) {

  var synapse = new Synapse(Collection, config);
  synapse.$handlers = {};
  synapse.$instances = [];
  Collection[name] = synapse;

  var $oldInitialize = Collection.prototype.initialize;
  Collection.prototype.initialize = function(){
    synapse.$instances.push(this);
    $oldInitialize.apply(this, arguments);
    if(config.debug) console.log("creating instance".blue, this);
  }

  Collection.prototype.free = function(){
    for(var i = 0; i<synapse.$instances.length; i++) {
      if(synapse.$instances[i] === this) {
        synapse.$instances.splice(i, 1);
        i -= 1;
        if(config.debug) console.log("freeing instance".blue, this);
      }
    }
  }

  Collection.prototype.once = function(eventName, handler, context) {
    var self = this;
    var functionWrap = function() {
      handler.apply(context || self, arguments);
      self.off(eventName, functionWrap);
    }
    this.on(eventName, functionWrap);
  }

  Collection.add = function(chemical, options){
    if(config.debug) console.log("updating collection instances for -->".blue, synapse.$instances.length, chemical);
    for(var i = 0; i<synapse.$instances.length; i++) {
      var instance = synapse.$instances[i];
      var url = instance.url || instance.model.prototype.url;
      if(instance.url == chemical.model.url) {
        if(config.debug) console.log("++++++ adding to collection instance".blue, url, chemical.model);
        instance.add(chemical.model, options);
      }
    }
  }

  Collection.remove = function(chemical, options){
    if(config.debug) console.log("updating collection instances for -->".blue, synapse.$instances.length, chemical);
    for(var i = 0; i<synapse.$instances.length; i++) {
      var instance = synapse.$instances[i];
      var url = instance.url || instance.model.prototype.url;
      if(instance.url == chemical.model.url && instance.get(chemical.model.id)) {
        if(config.debug) console.log("------ remove to collection instance".blue, url, chemical.model);
        instance.remove(instance.get(chemical.model.id), options);
      }
    }
  }

  Collection.set = function(chemical, options){
    if(config.debug) console.log("updating collection instances for -->".blue, synapse.$instances.length, chemical);
    for(var i = 0; i<synapse.$instances.length; i++) {
      var instance = synapse.$instances[i];
      var url = instance.url || instance.model.prototype.url;
      if(instance.url == chemical.model.url && instance.get(chemical.model.id)) {
        if(config.debug) console.log("+++++++ updating to collection instance".blue, url, chemical.model);
        instance.get(chemical.model.id).set(chemical.model);
      }
    }
  }

  Collection.on = function(eventName, handler, context) {
    synapse.$handlers[eventName] = synapse.$handlers[eventName] || [];
    handler.context = context;
    synapse.$handlers[eventName].push(handler);
  }

  Collection.off = function(eventName, handler) {
    if(synapse.$handlers[eventName]) {
      for(var i = 0; i<synapse.$handlers[eventName].length; i++)
        if(synapse.$handlers[eventName][i] === handler) {
          synapse.$handlers[eventName].splice(i, 1);
          i -= 1;
        }
    }
  }

  Collection.prototype.model.on("broadcast", function(chemical, sender, callback){
    if(chemical.method == "create") {
      Collection.add(chemical.model);
    }
    if(chemical.method == "delete") {
      Collection.remove(chemical.model);
    }
    if(chemical.method == "update") {
      Collection.set(chemical.model);
    }
  });
}