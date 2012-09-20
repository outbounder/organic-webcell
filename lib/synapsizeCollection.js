var Chemical = require("./Chemical");

module.exports = function(name, Collection, Synapse, config) {

  if(!Collection.synaptic) {
    Collection.$instances = [];
    Collection.synaptic = true;

    var $oldInitialize = Collection.prototype.initialize;
    Collection.prototype.initialize = function(){
      Collection.$instances.push(this);
      $oldInitialize.apply(this, arguments);
      if(config.debug) console.log("creating instance".blue, this);
    }

    Collection.prototype.free = function(){
      for(var i = 0; i<Collection.$instances.length; i++) {
        if(Collection.$instances[i] === this) {
          Collection.$instances.splice(i, 1);
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

    Collection.add = function(chemical){
      if(config.debug) console.log("adding collection instances for -->".blue, Collection.$instances.length, chemical);
      for(var i = 0; i<Collection.$instances.length; i++) {
        var instance = Collection.$instances[i];
        var url = instance.url || instance.model.prototype.url;
        if(url == chemical.model.url) {
          if(config.debug) console.log("++++++ adding to collection instance".blue, url, chemical.model);
          instance.add(chemical.model);
        }
      }
    }

    Collection.remove = function(chemical, options){
      if(config.debug) console.log("removeing collection instances for -->".blue, Collection.$instances.length, chemical);
      for(var i = 0; i<Collection.$instances.length; i++) {
        var instance = Collection.$instances[i];
        var url = instance.url || instance.model.prototype.url;
        if(url == chemical.model.url) {
          if(config.debug) console.log("------ remove to collection instance".blue, url, chemical.model);
          var m = instance.get(chemical.model.id);
          if(m)
            instance.remove(m);
          else
            instance.trigger("remove", chemical.model);
        }
      }
    }

    Collection.set = function(chemical, options){
      if(config.debug) console.log("updating collection instances for -->".blue, Collection.$instances.length, chemical);
      for(var i = 0; i<Collection.$instances.length; i++) {
        var instance = Collection.$instances[i];
        var url = instance.url || instance.model.prototype.url;
        if(url == chemical.model.url) {
          if(config.debug) console.log("+++++++ updating to collection instance".blue, url, chemical.model);
          var m = instance.get(chemical.model.id);
          if(m)
            m.set(chemical.model.toJSON());
          else
            instance.trigger("change", chemical.model);
        }
      }
    }

    Collection.prototype.model.on("broadcast", function(chemical, sender, callback){
      if(config.debug) console.log("collection:broadcast:handled".blue, chemical);
      if(chemical.method == "create") {
        Collection.add(chemical);
      }
      if(chemical.method == "delete") {
        Collection.remove(chemical);
      }
      if(chemical.method == "update") {
        Collection.set(chemical);
      }
      callback(null, chemical.model);
    });
  }

  var synapse = new Synapse(Collection, config);
  Collection[name] = synapse;
}