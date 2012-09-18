var Backbone = require("backbone");
var _ = require("underscore");
var mongojs = require("mongojs");

module.exports = function MongoBackbone(mongoStore, config){

  var store = mongoStore.store;

  var mongoSync = function mongoSync(method, model, options){

    // use default BackboneSync for other models...
    if(!(model instanceof Backbone.MongoModel) && !(model instanceof Backbone.MongoCollection)) {
      BackboneSync.call(this, method, model, options);
      return;
    }

    var callbackResult = function(err, data){
      if(err) return options.error(err);
      options.success(data);
    }

    var callback = function(err, data) {
      if(err) return options.error(err);
      options.success();
    }

    var collection = store.collection(model.collectionName || model.model.collectionName);

    switch(method) {
      case "create": 
        collection.save(model.toMongoJSON(), callbackResult);
      break;      
      case "read":
        if(model.id)
          collection.findOne({_id: mongojs.ObjectId(model.id.toString())}, callbackResult);
        else
          collection.find(model.pattern, callbackResult)
      break;
      case "update":
        if(model.id)
          pattern = {_id: mongojs.ObjectId(model.id.toString())};
        else
        if(model.pattern)
          pattern = model.pattern;
        else
          throw new Error("model does not contains id or pattern, to update everything use empty({}) pattern");
        collection.update(pattern, {$set: model.toMongoJSON()}, callback);
      break;
      case "delete":
        if(model.id)
          pattern = {_id: mongojs.ObjectId(model.id.toString())};
        else
        if(model.pattern)
          pattern = model.pattern;
        else
          throw new Error("model does not contains id or pattern, to delete everything use empty({}) pattern");
        collection.remove(pattern, callback);
      break;
      default:
        throw new Error("not recognized method ", method);
    }
  }

  Backbone.mongoStore = Backbone.mongoStore || {};
  Backbone.mongoStore[config.dbname] = Backbone.mongoStore[config.dbname] || {};
  
  Backbone.mongoStore[config.dbname].Model = Backbone.MongoModel = Backbone.Model.extend({
    idAttribute: "_id",
    collectionName: null,
    sync: mongoSync,
    toMongoJSON : function(){
      var json = this.toJSON();
      delete json._id;
      return json;
    }
  });

  Backbone.mongoStore[config.dbname].Collection = Backbone.MongoCollection = Backbone.Collection.extend({
    sync: mongoSync,
    initialize: function(pattern) {
      this.pattern = pattern || this.pattern;

      if(this.pattern)
        this.fetch({pattern: this.pattern});
    },
    removeAll: function(callback){
      var self = this;
      store.collection(this.collectionName || this.model.collectionName).remove(this.pattern, function(err, count){
        self.reset();
        if(callback)
          callback(err, count);
      });
    }
  });
}