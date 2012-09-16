var Backbone = require("backbone");
var _ = require("underscore");
var mongojs = require("mongojs");

var util = require("util");
var Organel = require("organic").Organel;
var Chemical = require("organic").Chemical;

module.exports = function MongoBackbone(plasma, config){
  Organel.call(this, plasma);

  var self = this;

  this.store = mongojs.connect(config.dbname);

  this.on("kill", function(){
    this.store.close();
    return false;
  });

  Backbone.store = Backbone.store || {};
  Backbone.store[config.dbname] = Backbone.store[config.dbname] || {};
  
  Backbone.store[config.dbname].Model = Backbone.MongoModel = Backbone.Model.extend({
    idAttribute: "_id",
    collectionName: null,
    sync: function(method, model, options){ self.mongoSync(method, model, options); },
    toMongoJSON : function(){
      var json = this.toJSON();
      delete json._id;
      return json;
    }
  });

  Backbone.store[config.dbname].Collection = Backbone.MongoCollection = Backbone.Collection.extend({
    sync: function(method, model, options){ self.mongoSync(method, model, options); },
    initialize: function(pattern) {
      if(pattern)
        this.fetch({pattern: pattern});
    }
  });
}

util.inherits(module.exports, Organel);

module.exports.prototype.mongoSync = function(method, model, options){

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

  var collection = this.store.collection(model.collectionName || model.model.collectionName);

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