var Chemical = require("./Chemical");

module.exports = function(name, Model, Synapse, config) {

  if(!Model.synaptic) {
    Model.$instances = [];
    Model.$handlers = {};
    Model.$synapses = [];
    Model.synaptic = true;

    var $oldInitialize = Model.prototype.initialize || function(){};
    Model.prototype.initialize = function(){
      Model.$instances.push(this);
      $oldInitialize.apply(this, arguments);
      if(config.debug) console.log("creating instance".green, this);
    }

    var $oldFree = Model.prototype.free || function(){};
    Model.prototype.free = function(){
      for(var i = 0; i<Model.$instances.length; i++) {
        if(Model.$instances[i] === this) {
          Model.$instances.splice(i, 1);
          i -= 1;
          if(config.debug) console.log("freeing instance".green, this);
        }
      }
      $oldFree.apply(this, arguments);
    }

    Model.prototype.once = function(eventName, handler, context) {
      var self = this;
      var functionWrap = function() {
        handler.apply(context || self, arguments);
        self.off(eventName, functionWrap);
      }
      this.on(eventName, functionWrap);
    }

    Model.prototype.sync = function(method, model, options){
      if(config.debug) console.log("sync".red, method, model);
      Model.broadcast({method: method, model: model, options: options}, this, function(err, response){
        if(config.debug) console.log("sync:end".red, err, response);
        if(err) return options.error(err);
        options.success(response);
      });
    }

    Model.set = function(chemical, data, options){
      if(config.debug) console.log("updating instances for -->".green, Model.$instances.length, data);
      var idAttribute, id;
      if(chemical.method == "create") {
        idAttribute = "cid";
        id = chemical.model.cid;
      } else {
        idAttribute = "id";
        id = data[Model.prototype.idAttribute || "id"];
      }
      if(config.debug) console.log("searching for:".green,  idAttribute, id);
      for(var i = 0; i<Model.$instances.length; i++) {
        var instance = Model.$instances[i];
        if(instance[idAttribute] == id) {
          if(config.debug) console.log("++++++ updating instance id".green, id);
          instance.set(data, options);
        }
      }
    }

    Model.destroy = function(data){
      if(config.debug) console.log("destroy instances for -->".green, Model.$instances.length, data);
      var id = data[Model.prototype.idAttribute || "id"];
      for(var i = 0; i<Model.$instances.length; i++) {
        var instance = Model.$instances[i];
        if(instance.id == id) {
          if(config.debug) console.log("destroy instance".green, id);
          instance.trigger("destroy");
        }
      }
    }

    Model.on = function(eventName, handler, context) {
      Model.$handlers[eventName] = Model.$handlers[eventName] || [];
      handler.context = context;
      Model.$handlers[eventName].push(handler);
    }

    Model.off = function(eventName, handler) {
      if(Model.$handlers[eventName]) {
        for(var i = 0; i<Model.$handlers[eventName].length; i++) {
          if(Model.$handlers[eventName][i] === handler) {
            Model.$handlers[eventName].splice(i, 1);
            i -= 1;
          }
        }
      }
    }

    Model.broadcast = function(chemical, sender, callback) {
      if(!(chemical instanceof Chemical))
        chemical = new Chemical({method: chemical.method, model: chemical.model, options: chemical.options});

      if(!(chemical.model instanceof Model)) {
        if(config.debug) console.log("creating shallow model".green);
        chemical.model = new Model(chemical.model);
        chemical.model.shallowModel = true;
      }

      if(config.debug) console.log(("broadcast").red, chemical);

      var handlers = Model.$handlers["broadcast"];
      if(!handlers) return callback();

      var i = 0;
      var next = function(err, response){
        if(err) return callback(err);
        if(response) {
          if(chemical.method == "create" || chemical.method == "update" || chemical.method == "read") {
            Model.set(chemical, response);
          }
        }

        var handler = handlers[i];
        i += 1;
        if(handler) {
          if(handler.context != sender) {
            handler.call(handler.context, chemical, sender, next);
          } else
            next(err, response); // bypass self
        } else {
          if(config.debug) console.log(("broadcast:end").red, response);
          if(response && chemical.method == "delete")
            Model.destroy(response);
          if(chemical.model.shallowModel) {
            chemical.model.free();    
            delete chemical.model.shallowModel;
          }
          callback(null, response);
        }
      }
      next();
    }
  }

  var synapse = new Synapse(Model, config);
  Model[name] = synapse;
  Model.$synapses.push(synapse);
}