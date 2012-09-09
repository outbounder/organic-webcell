var util = require("util");
var Organel = require("organic").Organel;
var Chemical = require("organic").Chemical;

module.exports = function RealtimeMongoResource(plasma, config){
  Organel.call(this, plasma);

  this.subscribers = [];

  this.on("socketClosed", function(chemical){
    this.destroySubscriber(chemical);
  });

  this.on("RealtimeMongoResource", function(chemical){
    chemical.type = chemical.chain.shift();

    var inputData = chemical.inputData;
    if(inputData.method == "POST" || inputData.method == "GET") {
      this.addSubscriber(chemical);
      if(inputData.method == "POST")
        this.notifyAllCollectionSubscribers(chemical);
    } else
    if(inputData.method == "PUT" || inputData.method == "DELETE") {

      this.notifyAllModuleSubscribers(chemical);
      this.notifyAllCollectionSubscribers(chemical);
      if(inputData.method == "DELETE") {
        this.removeSubscribers(chemical);
      }
    }

    if(chemical.type)
      this.emit(chemical);
  });

  this.on("RealtimeMongoResourceAdmin", function(chemical){
    chemical.type = chemical.chain.shift();

    if(chemical.data.method == "UNSUBSCRIBE") {
      this.destroySubscriber(chemical);
    }

    if(chemical.type)
      this.emit(chemical);
  });
}

util.inherits(module.exports, Organel);

module.exports.prototype.notifyAllModuleSubscribers = function(chemical){
  var inputData = chemical.inputData;
  for(var i = 0; i<this.subscribers.length; i++) {
    var subscriber = this.subscribers[i];
    var sameCollection = subscriber.collection == inputData.collection;
    var sameId = subscriber.id == inputData.id;
    var sameConnection = subscriber.connection == chemical.connection;

    if(sameCollection && sameId && !sameConnection) {
      subscriber.connection.emit("RealtimeMongoResource", inputData);
    }
  }
}

module.exports.prototype.notifyAllCollectionSubscribers = function(chemical){
  var inputData = chemical.inputData;

  for(var i = 0; i<this.subscribers.length; i++) {
    var subscriber = this.subscribers[i];
    if(subscriber.id != undefined) continue; // skip subscribers by id, and notify only those for collection match

    var sameCollection = subscriber.collection == inputData.collection;
    var notSameConnection = subscriber.connection != chemical.connection;

    if(sameCollection && notSameConnection)
      subscriber.connection.emit("RealtimeMongoResource", inputData);
  }
}

module.exports.prototype.addSubscriber = function(chemical){
  this.subscribers.push({
    connection: chemical.connection, 
    collection: chemical.inputData.collection,
    id: chemical.data._id?chemical.data._id.toString():undefined
  });
}

module.exports.prototype.removeSubscribers = function(chemical) {
  var inputData = chemical.inputData;
  for(var i = 0; i<this.subscribers.length; i++) {
    var subscriber = this.subscribers[i];
    var sameCollection = subscriber.collection == inputData.collection;
    var sameId = subscriber.id == chemical.id;
    if(sameCollection && sameId) {
      this.subscribers.splice(i, 1);
      i -= 1;
    }
  }
}

module.exports.prototype.destroySubscriber = function(chemical){
  for(var i = 0; i<this.subscribers.length; i++) {
    var subscriber = this.subscribers[i];
    var sameCollection = chemical.collection?subscriber.collection == chemical.collection:true;
    var sameConnection = subscriber.connection == chemical.connection;
    if(sameCollection && sameConnection) {
      this.subscribers.splice(i, 1);
      i -= 1;
    }
  }
}