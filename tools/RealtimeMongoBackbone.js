var io = require("socket.io-client");
var _ = require("underscore");


module.exports.attach = function(Backbone, realtimeOptions){

  var realtime = {
    modelInstances: [],
    collectionInstances: [],
    connection: null
  };

  var realtimeSync = function(method, model, options) {

    var connection = model.$connection || realtime.connection;
    
    var linkAddCallback = function(err, data) {
      if(err) return options.error(err);
      connection.emit("link", data);
      connection.emit("model:add", data);
      options.success(data);
    }
    var linkCallback = function(err, data) {
      if(err) return options.error(err);
      connection.emit("link", data);
      options.success(data);
    }
    var unlinkCallback = function(err, data) {
      if(err) return options.error(err);
      connection.emit("unlink", data);
      connection.emit("model:remove", data);
      modelInstances.
      options.success();
    }
    
    switch(method) {
      case "create":
        connection.emit("MongoStore", {method: "save", data: model.toMongoJSON()}, linkAddCallback);
      break;
      case "read":
        connection.emit("MongoStore", {method: "find", data: model.id || model.pattern}, linkCallback);
      break;
      case "update":
        connection.emit("MongoStore", {method: "update", data: model.id || model.pattern, body: model.toMongoJSON()}, callback);
      break;
      case "delete":
        connection.emit("MongoStore", {method: "remove", data: model.id || model.pattern}, unlinkCallback);
      break;
    }
  }

  realtime.connect = function(target, options, callback){
    if(typeof options == "function") {
      callback = options;
      options = {};
    }
    
    realtime.connection = io.connect(target, options);
    realtime.connection.on("connect", function(){
      callback();
    });
    realtime.connection.on("model:add", function(data){
      modelInstances.add(new Backbone.RealtimeModel(data));
    });
    realtime.connection.on("model:change", function(data){
      modelInstances.get(data.id).set(data);
    });
    realtime.connection.on("model:remove", function(data){
      modelInstances.get(data.id).destroy();
    });
    realtime.connection.on("collection:reset", function(){
      collectionInstances.get(data.pattern).reset();
    });
  }

  realtime.disconnect = function(){
    realtime.connection.disconnect();
    realtime.connection = undefined;
  }

  Backbone.RealtimeModel = Backbone.Model.extend({
    sync: realtimeSync,
    connection: function(){
      return this.$connection || realtime.connection;
    },
    useConnection: function(value, ownHandler){
      this.$connection = value;
      this.$connection.on("model:change", modelChanged);
      this.$connection.on("model:add", modelAdded);
      this.$connection.on("model:remove", modelRemoved);
      this.$connection.on("collection:reset", collectionReset);
    },
    disableRealtime: function(callback){
      this.realtime = false;
      this.connection().emit("unlink", this, callback);
    }
  });

  Backbone.RealtimeCollection = Backbone.Collection.extend({
    sync: realtimeSync,
    connection: function(){
      return this.$connection || realtime.connection;
    },
    useConnection: function(value){
      this.$connection = value;
      this.$connection.on("model:change", modelChanged);
      this.$connection.on("model:add", modelAdded);
      this.$connection.on("model:remove", modelRemoved);
      this.$connection.on("collection:reset", collectionReset);
    },
    disableRealtime: function(callback){
      this.realtime = false;
      this.connection().emit("unlink", this, callback);
    }
  });

  return realtime;
}