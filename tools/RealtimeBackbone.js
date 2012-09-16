var io = require("socket.io-client");
var _ = require("underscore");

var handleNotifications = function(inputData, modelInstances, collectionInstances){
  if(inputData.method == "POST") {
    for(var i = 0; i<collectionInstances.length; i++) {
      var collection = collectionInstances[i];
      if(collection.collectionName == inputData.collection) {

        // register newly added models for updates
        var m = new collection.model(inputData.body);
        modelInstances.push(m);

        // add to collection
        collection.add(m);
      }
    }
    return;
  }

  for(var i = 0; i<modelInstances.length; i++) {
    var model = modelInstances[i];
    if(model.id == inputData.id) {
      if(inputData.method == "PUT")
        model.set(inputData.body["$set"]);
      if(inputData.method == "DELETE")
        model.destroy();
    }
  }
}

module.exports.attach = function(Backbone, realtimeOptions){
  realtimeOptions = realtimeOptions || {
    storeMessage: "RealtimeMongoResource",
    realtimeManagementMessage: "RealtimeMongoResourceAdmin",
    realtimeNotificationMessage: "RealtimeMongoResource"
  }

  var realtime = {
    modelInstances: [],
    collectionInstances: [],
    connection: null
  };

  realtime.connect = function(target, options, callback){
    if(typeof options == "function") {
      callback = options;
      options = {};
    }
    
    realtime.connection = io.connect(target, options);
    realtime.connection.on("connect", function(){
      callback();
    });
    realtime.connection.on(realtimeOptions.realtimeNotificationMessage, function(data){
      handleNotifications(data, realtime.modelInstances, realtime.collectionInstances);
    });
  }

  realtime.disconnect = function(){
    realtime.connection.disconnect();
    realtime.connection = undefined;
  }

  var mongoSync = function(method, model, options){
    if(!(model instanceof Backbone.RealtimeModel) && !(model instanceof Backbone.RealtimeCollection))
      return BackboneSync.call(this, method, model, options);

    if(!model.collectionName)
      throw new Error("Missing collectionName in model", model);

    var connection = model.connection();

    if(!connection)
      throw new Error("Missing connection in model or realtime not connected");

    var data;
    var pattern;
    if(method == "create" ||  method == "update")
      data = model.toJSON();
    else
      data = model.id || model.pattern;

    connection.emit(realtimeOptions.storeMessage, {
      collection: model.collectionName,
      method: method,
      data: data,
      pattern: method == "update"?(model.id || model.pattern):undefined
    }, function(err, data){
      if(err) return options.error(err);
      options.success(data);
    });

  }

  Backbone.RealtimeModel = Backbone.Model.extend({
    idAttribute: "_id",
    sync: mongoSync,
    connection: function(){
      return this.$connection || realtime.connection;
    },
    useConnection: function(value, ownHandler){
      this.$connection = value;
      this.$connection.on(realtimeOptions.realtimeNotificationMessage, ownHandler || function(data){
        handleNotifications(data, realtime.modelInstances, realtime.collectionInstances);
      });
    },
    disableRealtime: function(callback){
      this.realtime = false;
      var connection = this.connection();
      connection.emit(realtimeOptions.realtimeManagementMessage, {
        method: "unsubscribe",
        collection: this.collectionName,
        data: this.id
      }, callback);

      for(var i = 0; i<realtime.modelInstances.length; i++) {
        if(realtime.modelInstances[i] === this) {
          realtime.modelInstances.splice(i, 1);
          i -= 1;
        }
      }
    }
  });

  Backbone.RealtimeCollection = Backbone.Collection.extend({
    sync: mongoSync,
    connection: function(){
      return this.$connection || realtime.connection;
    },
    useConnection: function(value, ownHandler){
      this.$connection = value;
      this.$connection.on(realtimeOptions.realtimeNotificationMessage, ownHandler || function(data){
        handleNotifications(data, realtime.modelInstances, realtime.collectionInstances);
      });
    },
    disableRealtime: function(callback){
      this.realtime = false;
      var connection = this.connection();
      connection.emit(realtimeOptions.realtimeManagementMessage, {
        method: "unsubscribe",
        collection: this.collectionName
      }, callback);

      for(var i = 0; i<realtime.collectionInstances.length; i++) {
        if(realtime.collectionInstances[i] === this) {
          realtime.collectionInstances.splice(i, 1);
          i -= 1;
        }
      }
    }
  });

  return realtime;
}