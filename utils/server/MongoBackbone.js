var _ = require("underscore");

module.exports.attach = function(Backbone, plasma, realtimeOptions) {

  realtimeOptions = _.extend({
    chain: ["MongoStore", "MongoBackbone"]
  }, realtimeOptions || {});
  
  var count = 0;
  var callbacks = [];
  var modelInstances = [];

  plasma.on("MongoBackbone", function(chemical){
    // fired once there is response for the op
    for(var i = 0; i<callbacks.length; i++)
      if(chemical.traceId == callbacks[i].traceId) {
        var callback = callbacks[i];
        callbacks.splice(i,1);
        if(chemical.data && !chemical.err) {
          modelInstances.push(callback.model);
          callback.options.success(chemical.data)
        } else
          callback.options.error(chemical.err);
        return;
      }
  });

  var serverConnection = {
    emit: function(eventName, inputData) {
      for(var i = 0; i<modelInstances.length; i++)
        if(modelInstances[i].id == inputData.id)
          modelInstances[i].set(inputData.body["$set"]);
    }
  }
    
  var BackboneSync = Backbone.sync;
  Backbone.sync = function(method, model, options){
    // use default BackboneSync for other models...
    if(!(model instanceof Backbone.MongoModel) && !(model instanceof Backbone.MongoCollection)) {
      BackboneSync.call(this, method, model, options);
      return;
    }

    var callback = {model: model, options: options, traceId: count++};
    callbacks.push(callback);

    var chain = _.clone(realtimeOptions.chain);
    var type = chain.shift();
    switch(method) {
      case "create": 
        plasma.emit({
          type: type,
          chain: chain,
          traceId: callback.traceId,
          connection: serverConnection,
          data: {
            collection: model.collectionName,
            method: "POST",
            body: model.toMongoJSON()
          }
        });
      break;
      case "read":
        plasma.emit({
          type: type,
          chain: chain,
          traceId: callback.traceId,
          connection: serverConnection,
          data: {
            collection: model.collectionName,
            pattern: options.pattern,
            id: model.id,
            method: "GET"
          }
        });
      break;
      case "update":
        plasma.emit({
          type: type,
          chain: chain,
          traceId: callback.traceId,
          connection: serverConnection,
          data: {
            collection: model.collectionName,
            pattern: options.pattern,
            id: model.id,
            method: "PUT",
            body: {$set: model.toMongoJSON()}
          }
        });
      break;
      case "delete":
        plasma.emit({
          type: type,
          chain: chain,
          traceId: callback.traceId,
          connection: serverConnection,
          data: {
            collection: model.collectionName,
            pattern: options.pattern,
            id: model.id,
            method: "DELETE"
          }
        });
      break;
      default:
        throw new Error("not recognized method ", method);
    }
  };

  Backbone.MongoModel = Backbone.Model.extend({
    idAttribute: "_id",
    collectionName: null,
    toMongoJSON : function(){
      var json = this.toJSON();
      delete json._id;
      return json;
    }
  });

  Backbone.MongoCollection = Backbone.Collection.extend({
    collectionName: null,
    initialize: function(pattern) {
      if(pattern)
        this.fetch({pattern: pattern});
    }
  });

}