var Chemical = require("./Chemical");

module.exports = function(name, Collection, Synapse, config) {

  if(!Collection.synaptic) {
    Collection.$synapses = [];
    Collection.$instances = [];
    Collection.$handlers = {};
    Collection.synaptic = true;

    var $oldInitialize = Collection.prototype.initialize;
    Collection.prototype.initialize = function(){
      Collection.$instances.push(this);
      $oldInitialize.apply(this, arguments);
      if(config.debug) console.log("creating instance".blue, config.debugData?this:"");
    }

    Collection.prototype.free = function(){
      for(var i = 0; i<Collection.$instances.length; i++) {
        if(Collection.$instances[i] === this) {
          Collection.$instances.splice(i, 1);
          i -= 1;
          if(config.debug) console.log("freeing instance".blue, config.debugData?this:"");
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

    Collection.prototype.sync = function(method, model, options){
      if(method != "read") throw new Error("Not implemented");
      if(config.debug) console.log("collection:sync".blue, method, model);
      Collection.broadcast({method: method, model: model, options: options}, this, function(err, response){
        if(config.debug) console.log("collection:sync:end".blue, err, response);
        if(err) return options.error(err);
        options.success(response);
      });
    };

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

    Collection.on = function(eventName, handler, context) {
      Collection.$handlers[eventName] = Collection.$handlers[eventName] || [];
      handler.context = context;
      Collection.$handlers[eventName].push(handler);
    }

    Collection.off = function(eventName, handler) {
      if(Collection.$handlers[eventName]) {
        for(var i = 0; i<Collection.$handlers[eventName].length; i++) {
          if(Collection.$handlers[eventName][i] === handler) {
            Collection.$handlers[eventName].splice(i, 1);
            i -= 1;
          }
        }
      }
    }

    Collection.broadcast = function(chemical, sender, callback) {
      if(!(chemical instanceof Chemical))
        chemical = new Chemical({method: chemical.method, model: chemical.model, options: chemical.options});

      if(config.debug) console.log(("broadcast").blue, chemical);

      var handlers = Collection.$handlers["broadcast"];
      if(!handlers) return callback();

      var i = 0;
      var next = function(err, response){
        if(err) return callback(err);
        
        var handler = handlers[i];
        i += 1;
        if(handler) {
          if(handler.context != sender) {
            handler.call(handler.context, chemical, sender, next);
          } else
            next(err, response); // bypass self
        } else {
          if(config.debug) console.log(("broadcast:end").blue, response);
          callback(null, response);
        }
      }
      next();
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
      callback(null, chemical.model.toJSON());
    });
  }

  var synapse = new Synapse(Collection, config);
  Collection[name] = synapse;
  Collection.$synapses.push(synapse);
}