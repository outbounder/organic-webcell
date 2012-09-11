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
    storeMessage: "MongoStore",
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

  var BackboneSync = Backbone.sync;

  Backbone.sync = function(method, model, options){
    if(!model.realtime)
      return BackboneSync.call(this, method, model, options);

    if(!model.collectionName)
      throw new Error("Missing collectionName in model", model);

    var connection = model.connection();

    if(!connection)
      throw new Error("Missing connection in model or realtime not connected");

    switch(method) {
      case "create": 
        connection.emit(realtimeOptions.storeMessage, {
          collection: model.collectionName,
          method: "POST",
          body: model.toJSON()
        }, function(err, data){
          if(err) {
            options.error(err);
          } else {
            options.success(data);
            realtime.modelInstances.push(model);
          }
        });
      break;
      case "read":
        connection.emit(realtimeOptions.storeMessage, {
          collection: model.collectionName,
          pattern: options.pattern,
          id: model.id,
          method: "GET"
        }, function(err, data){
          if(err) {
            options.error(err);
          } else {
            options.success(data);
            if(model instanceof Backbone.RealtimeCollection) {
              for(var i = 0; i<model.models.length; i++)
                realtime.modelInstances.push(model.models[i]);
              realtime.collectionInstances.push(model);
            }
            else
              realtime.modelInstances.push(model);
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

        connection.emit(realtimeOptions.storeMessage, {
          collection: model.collectionName,
          pattern: options.pattern,
          id: model.id,
          method: "PUT",
          body: updateData
        }, function(err, data){
          if(err) 
            options.error(err);
          else
            options.success(data);
        });
      break;
      case "delete":
        connection.emit(realtimeOptions.storeMessage, {
          collection: model.collectionName,
          pattern: options.pattern,
          id: model.id,
          method: "DELETE"
        }, function(err, data){
          if(err) {
            options.error(err);
          } else {
            options.success(data);
            for(var i = 0; i<realtime.modelInstances.length; i++) {
              if(model == realtime.modelInstances[i]) {
                realtime.modelInstances.splice(i,1);
                i -= 1;
              }
            }
          }
        });
      break;
      default:
        throw new Error("not recognized method ", method);
    }
  }

  Backbone.RealtimeModel = Backbone.Model.extend({
    idAttribute: "_id",
    realtime: true,
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
        method: "UNSUBSCRIBE",
        collection: this.collectionName,
        id: this.id
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
    realtime: true,
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
        method: "UNSUBSCRIBE",
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