var Chemical = require("./Chemical");

module.exports = function(name, Model, synapse, config) {

  var modelSynapse = new synapse(Model, config);
  modelSynapse.$handlers = {};
  modelSynapse.$instances = [];
  Model[name] = modelSynapse;

  var $oldInitialize = Model.prototype.initialize;
  Model.prototype.initialize = function(){
    modelSynapse.$instances.push(this);
    $oldInitialize.apply(this, arguments);
    if(config.debug) console.log("creating instance".green, this);
  }

  Model.prototype.sync = function(method, model, options){
    if(config.debug) console.log("sync".red, method, model);
    Model.broadcast({method: method, model: model, options: options}, this, function(err, response){
      if(config.debug) console.log("sync:end".red, err, response);
      if(err) return options.error(err);
      options.success(response);
    });
  }

  Model.prototype.free = function(){
    for(var i = 0; i<modelSynapse.$instances.length; i++) {
      if(modelSynapse.$instances[i] === this) {
        modelSynapse.$instances.splice(i, 1);
        i -= 1;
        if(config.debug) console.log("freeing instance".green, this);
      }
    }
  }

  Model.prototype.once = function(eventName, handler, context) {
    var self = this;
    var functionWrap = function() {
      handler.apply(context || self, arguments);
      self.off(eventName, functionWrap);
    }
    this.on(eventName, functionWrap);
  }

  Model.set = function(chemical, data, options){
    if(config.debug) console.log("updating instances for -->".green, modelSynapse.$instances.length, data);
    var idAttribute, id;
    if(chemical.method == "create") {
      idAttribute = "cid";
      id = chemical.model.cid;
    } else {
      idAttribute = "id";
      id = data[Model.prototype.idAttribute || "id"];
    }
    if(config.debug) console.log("searching for:".green,  idAttribute, id);
    for(var i = 0; i<modelSynapse.$instances.length; i++) {
      var instance = modelSynapse.$instances[i];
      if(instance[idAttribute] == id) {
        if(config.debug) console.log("++++++ updating instance id".green, id);
        instance.set(data, options);
      }
    }
  }

  Model.destroy = function(data){
    if(config.debug) console.log("destroy instances for -->".green, modelSynapse.$instances.length, data);
    var id = data[Model.prototype.idAttribute || "id"];
    for(var i = 0; i<modelSynapse.$instances.length; i++) {
      var instance = modelSynapse.$instances[i];
      if(instance.id == id) {
        if(config.debug) console.log("destroy instance".green, id);
        instance.trigger("destroy");
      }
    }
  }

  Model.on = function(eventName, handler, context) {
    modelSynapse.$handlers[eventName] = modelSynapse.$handlers[eventName] || [];
    handler.context = context;
    modelSynapse.$handlers[eventName].push(handler);
  }

  Model.off = function(eventName, handler) {
    if(modelSynapse.$handlers[eventName]) {
      for(var i = 0; i<modelSynapse.$handlers[eventName].length; i++)
        if(modelSynapse.$handlers[eventName][i] === handler) {
          modelSynapse.$handlers[eventName].splice(i, 1);
          i -= 1;
        }
    }
  }

  Model.broadcast = function(chemical, sender, callback) {
    if(!(chemical instanceof Chemical))
      chemical = new Chemical({method: chemical.method, model: chemical.model, options: chemical.options});

    if(config.debug) console.log("broadcast".red, chemical);

    if(!(chemical.model instanceof Model)) {
      if(config.debug) console.log("creating shallow model".green);
      chemical.model = new Model(chemical.model);
      chemical.model.shallowModel = true;
    }

    var handlers = modelSynapse.$handlers["broadcast"];
    if(!handlers) return;

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
        if(config.debug) console.log("broadcast:end".red, response);
        if(response && chemical.method == "delete")
          Model.destroy(response);
        if(chemical.model.shallowModel)
          chemical.model.free();
        callback(null, response);
      }
    }
    next();
  }
}