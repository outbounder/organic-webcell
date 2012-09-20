var Backbone = require("backbone");
var _ = require("underscore");
var mongojs = require("mongojs");

module.exports = function MongoBackbone(mongoStore, config){

  var store = mongoStore.store;

  Backbone.MongoSynapse = function(ModelClass, _config) {
    this.ModelClass = ModelClass;
    this.config = _config || config;
  }

  Backbone.MongoSynapse.prototype.connect = function(){
    var self = this;
    this.ModelClass.on("broadcast", function(chemical, sender, callback){
      if(this.config.debug) console.log("mongo".red, chemical);
      mongoSync(chemical.method, chemical.model, {
        success: function(data){ 
          if(self.config.debug) console.log("mongo:result".red, data);
          callback(null, data); 
        },
        error: function(m, err) { 
          callback(err); 
        }
      });
    }, this);
  }

  var mongoSync = function mongoSync(method, model, options){
    var readResponse = function(err, data){
      if(err) return options.error(err);
      if(data._id)
        data._id = data._id.toString();
      if(_.isArray(data))
        _.each(data, function(d){ if(d._id) d._id = d._id.toString(); });
      options.success(data);
    }

    var url = model.url || model.model.prototype.url;
    var collectionName = _.isFunction(url) ? url() :url;
    var collection = store.collection(collectionName);

    switch(method) {
      case "create": 
        collection.save(model.toJSON(), function(err, data) {
          if(err) return options.error(err);
          if(data._id)
            data._id = data._id.toString();
          options.success(data);
        });
      break;      
      case "read":
        if(model.id)
          collection.findOne({_id: mongojs.ObjectId(model.id)}, readResponse);
        else
        if(model.pattern) 
          collection.find(model.pattern, readResponse);
        else
          throw new Error("model does not continas id or pattern, to read everything use empty({}) pattern");
      break;
      case "update":
        var pattern;
        if(model.id)
          pattern = {_id: mongojs.ObjectId(model.id)};
        else
          throw new Error("updating model without id");
        
        var updateData = model.toJSON();
        if(updateData._id) delete updateData._id;

        collection.update(pattern, {$set: updateData}, function(err, count){
          if(err || count == 0) 
            return options.error(err || new Error("failed to update model, mongo returned count "+count));
          // return back the id to the updateData
          updateData._id = model.id; 
          // emit back the updated data. mongodb do not return 
          // updated data, calling modle.toJSON() here returns old json, 
          // not equal to updateData constructed above. therefore we are emitting updateData instead. 
          // really strange issue indeed however the code makes sense
          options.success(updateData); 
        });
      break;
      case "delete":
        var pattern;
        if(model.id)
          pattern = {_id: mongojs.ObjectId(model.id)};
        else
          throw new Error("deleting model without id");
        collection.remove(pattern, function(err, data) {
          if(err) return options.error(err);
          options.success(model.toJSON());
        });
      break;
      default:
        throw new Error("not recognized method ", method);
    }
  }
  
  Backbone.MongoModel = Backbone.Model.extend({
    idAttribute: "_id",
  });

  Backbone.MongoCollection = Backbone.Collection.extend({
    removeAll: function(){
      var self = this;
      var collectionName = _.isFunction(this.url) ? this.url() : this.url;
      store.collection(collectionName).remove(this.pattern, function(err, count){
        if(err) throw err;
        self.fetch();
      });
    }
  });
}