var util = require("util");
var Organel = require("organic").Organel;
var Chemical = require("organic").Chemical;

var mongojs = require('mongojs');

module.exports = function MongoStore(plasma, config){
  Organel.call(this, plasma);

  this.store = mongojs.connect(config.dbname);
  this.config = config;

  var self = this;
  this.on("MongoStore", this.handleIncomingChemical);

  this.on("kill", function(){
    this.store.close();
    return false;
  });
}

util.inherits(module.exports, Organel);

module.exports.prototype.handleIncomingChemical = function(chemical){
  var self = this;
  self.executeMongoAction(chemical, function(){
    chemical.type = chemical.chain.shift();
    self.emit(chemical);
  });
}

module.exports.prototype.executeMongoAction = function(chemical, callback) {

  // store data as inputData, to be used later on when needed
  // this is done before collection handlers, because after actions expect inputData prop.
  var inputData = chemical.inputData = chemical.data;

  if(!inputData.collection) {
    chemical.err = new Error("Missing collection in data", inputData);
    callback();
    return;
  }

  var collection = this.store.collection(inputData.collection);

  switch(inputData.method) {
    case "POST":

      collection.save(inputData.body, inputData.options || {}, function(err, data){
        chemical.err = err;
        if(data) // XXX convert _id to string
          data._id = data._id.toString();
        chemical.data = data;
        callback();
      });
    break;
    case "GET":
      if(inputData.id)
        collection.findOne({_id: mongojs.ObjectId(inputData.id)}, function(err, data){
          chemical.err = err;
          chemical.data = data;
          callback();
        });
      else
        collection.find(inputData.pattern || {}, inputData.options || {}, function(err, data){
          chemical.err = err;
          chemical.data = data;
          callback();
        });
    break;
    case "PUT":
      var pattern;
      if(inputData.id)
        pattern = {_id: mongojs.ObjectId(inputData.id)};
      else
        pattern = inputData.pattern;
      collection.update(pattern, inputData.body, inputData.options || {}, function(err, count){
        chemical.err = err;
        chemical.data = count;
        callback();
      });
    break;
    case "DELETE":
      var pattern;
      if(inputData.id)
        pattern = {_id: mongojs.ObjectId(inputData.id)};
      else
        pattern = inputData.pattern;
      collection.remove(pattern, inputData.options || {}, function(err, count){
        chemical.err = err;
        chemical.data = count;
        callback();
      });
    break;
    default: 
      throw new Error("couldn't understand type ", inputData.method, chemical);
    break;
  }
}