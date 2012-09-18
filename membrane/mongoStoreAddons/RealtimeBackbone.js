var Backbone = require("backbone");
var _ = require("underscore");

module.exports = function RealtimeBackbone(mongoStore, config){
  
  mongoStore.on("kill", function(){
    return false;
  });

  var subscribtions = new Backbone.Collection({});

  var broadcastModelChange = function(model){
    subscribtions.each(function(chemical){

      var notSelf = chemical.model != model;
      var equalIds = chemical.model.id == model.id;
      var equalCollection = chemical.collection.model.collectionName == model.collectionName;

      if(notSelf && (equalIds || equalCollection))
        chemical.connection.emit("model:change", model);
    });
  }

  var broadcastCollectionChange = function(op){
    return function(model){
      subscribtions.each(function(chemical){

        var notSelf = chemical.model != model;
        var equalCollection = chemical.collection.model.collectionName == model.collectionName;

        if(notSelf && equalCollection)
          chemical.connection.emit("model:"+op, model);
      });
    }
  }

  var broadcastCollectionReset = function(op){
    return function(model){
      subscribtions.each(function(chemical){

        var notSelf = chemical.model != model;
        var equalCollection = chemical.collection.model.collectionName == model.collectionName;

        if(notSelf && equalCollection)
          chemical.connection.emit("collection:reset", model);
      });
    }
  }

  mongoStore.on("link", function(chemical){
    if(chemical.modelPattern) {
      chemical.model = new Backbone.RealtimeModel(chemical.modelPattern);
      chemical.model.on("change", broadcastModelChange);
      chemical.connection.on("model:change", broadcastModelChange);
    }
    if(chemical.collectionPattern) {
      chemical.collection = new Backbone.RealtimeCollection(chemical.collectionPattern);
      chemical.collection.on("add", broadcastCollectionChange("add"));
      chemical.collection.on("remove", broadcastCollectionChange("remove"));
      chemical.collection.on("reset", broadcastCollectionReset);
      chemical.connection.on("model:add", broadcastCollectionChange("add"));
      chemical.connection.on("model:remove", broadcastCollectionChange("remove"));
      chemical.connection.on("model:reset", broadcastCollectionChange("reset"));
    }
    subscribtions.add(chemical);
  });

  mongoStore.on("unlink", function(chemical){
    subscribtions.remove(chemical);
  });

  Backbone.RealtimeModel = Backbone[config.baseModel || "Model"].extend({
    autosync: function(value){
      mongoStore.plasma.emit({
        type: value?"link":"unlink",
        connection: {
          emit: this.trigger,
          on: this.on
        },
        modelPattern: {
          _id: this.id
        }
      });
    }
  });

  Backbone.RealtimeCollection = Backbone[config.baseCollection || "Collection"].extend({
    autosync: function(value){
      mongoStore.plasma.emit({
        type: value?"link":"unlink", 
        connection: {
          emit: this.trigger,
          on: this.on
        },
        collectionPattern: this.pattern
      });
    }
  });
}