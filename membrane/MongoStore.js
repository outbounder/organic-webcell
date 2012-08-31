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
  self.executeBeforeAction(chemical, function(){
    self.executeMongoAction(chemical, function(){
      self.executeAfterAction(chemical, function(){
        chemical.type = chemical.chain.shift();
        self.emit(chemical);
      });
    });
  });
}

module.exports.prototype.executeBeforeAction = function(chemical, callback){
  if(this.config.collections && this.config.collections.before[chemical.data.collection]) {
    var mongoActionConfig = this.config.collections.before[chemical.data.collection];
    var mongoAction;
    if(typeof mongoActionConfig == "string")
      mongoAction = require(process.cwd()+mongoActionConfig);
    else
      mongoAction = require(process.cwd()+mongoActionConfig[chemical.data.type]);
    mongoAction.call(this, chemical, callback);
    return;
  } else
    callback();
}

module.exports.prototype.executeAfterAction = function(chemical, callback){
  if(this.config.collections && this.config.collections.after[chemical.inputData.collection]) {
    var mongoActionConfig = this.config.collections.after[chemical.inputData.collection];
    var mongoAction;
    if(typeof mongoActionConfig == "string")
      mongoAction = require(process.cwd()+mongoActionConfig);
    else
      mongoAction = require(process.cwd()+mongoActionConfig[chemical.data.type]);
    mongoAction.call(this, chemical, callback);
    return;
  } else
    callback();
}

module.exports.prototype.executeMongoAction = function(chemical, callback) {

  // store data as inputData, to be used later on when needed
  // this is done before collection handlers, because after actions expect inputData prop.
  var inputData = chemical.inputData = chemical.data;

  if(this.config.collections && this.config.collections.handle[chemical.data.collection]) {
    var mongoActionConfig = this.config.collections.handle[chemical.data.collection];
    var mongoAction;
    if(typeof mongoActionConfig == "string")
      mongoAction = require(process.cwd()+mongoActionConfig);
    else
      mongoAction = require(process.cwd()+mongoActionConfig[chemical.data.type]);
    mongoAction.call(this, chemical, callback);
    return;
  }

  if(!inputData.collection) {
    chemical.err = new Error("Missing collection in data", inputData);
    callback();
    return;
  }

  var collection = this.store.collection(inputData.collection);

  switch(inputData.type) {
    case "insert":
      collection.insert(inputData.value, inputData.options || {}, function(err, data){
        chemical.err = err;
        chemical.data = data;
        callback();
      });
    break;
    case "create":
      collection.save(inputData.value, inputData.options || {}, function(err, data){
        chemical.err = err;
        chemical.data = data;
        callback();
      });
    break;
    case "read":
      if(inputData.id)
        collection.findOne({_id: mongojs.ObjectId(inputData.id)}, inputData.options || {}, function(err, data){
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
    case "update":
      var pattern;
      if(inputData.id)
        pattern = {_id: mongojs.ObjectId(inputData.id)};
      else
        pattern = inputData.pattern;
      collection.update(pattern, inputData.value, inputData.options || {}, function(err, count){
        chemical.err = err;
        chemical.data = count;
        callback();
      });
    break;
    case "delete":
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
      throw new Error("couldn't understand type ", inputData.type, chemical);
    break;
  }
}