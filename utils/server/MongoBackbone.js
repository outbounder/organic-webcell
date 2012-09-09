var _ = require("underscore");

module.exports.attach = function(Backbone, plasma) {

  var realtimeOptions = {
    storeMessage: "MongoStore"
  }
  var count = 0;
  var callbacks = [];

  plasma.on("MongoBackbone", function(chemical){
    // fired once there is response for the op
    for(var i = 0; i<callbacks.length; i++)
      if(chemical.traceId == callbacks[i].traceId) {
        var callback = callbacks[i];
        callbacks.splice(i,1);
        if(chemical.data && !chemical.err)
          callback.options.success(chemical.data)
        else
          callback.options.error(chemical.err);
        return;
      }
  });

  var BackboneSync = Backbone.sync;
  Backbone.sync = function(method, model, options){

    // use default BackboneSync for other models...
    if(!(model instanceof Backbone.MongoModel) && !(model instanceof Backbone.MongoCollection)) {
      BackboneSync.call(this, method, model, options);
      return;
    }

    var callback = {model: model, options: options, traceId: count++};
    callbacks.push(callback);

    switch(method) {
      case "create": 
        plasma.emit({
          type: realtimeOptions.storeMessage,
          chain: ["MongoBackbone"],
          traceId: callback.traceId,
          data: {
            collection: model.collectionName,
            method: "POST",
            body: model.toJSON()
          }
        });
      break;
      case "read":
        plasma.emit({
          type: realtimeOptions.storeMessage,
          chain: ["MongoBackbone"],
          traceId: callback.traceId,
          data: {
            collection: model.collectionName,
            pattern: options.pattern,
            id: model.id,
            method: "GET"
          }
        });
      break;
      case "update":

        // get JSON representation
        var updateData = model.toJSON();
        
        delete updateData._id; // XXX

        // in case it is updating via model
        if(model.id)
          updateData = {$set: updateData};
        plasma.emit({
          type: realtimeOptions.storeMessage,
          chain: ["MongoBackbone"],
          traceId: callback.traceId,
          data: {
            collection: model.collectionName,
            pattern: options.pattern,
            id: model.id,
            method: "PUT",
            body: updateData
          }
        });
      break;
      case "delete":
        plasma.emit({
          type: realtimeOptions.storeMessage,
          chain: ["MongoBackbone"],
          traceId: callback.traceId,
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
    collectionName: null
  });

  Backbone.MongoCollection = Backbone.Collection.extend({
    collectionName: null
  });

}