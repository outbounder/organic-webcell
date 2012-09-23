var util = require("util");
var Organel = require("organic").Organel;
var Chemical = require("organic").Chemical;

var io = require('socket.io');
var _ = require("underscore");

module.exports = function WebSocketServer(plasma, config){
  Organel.call(this, plasma);

  var self = this;
  this.config = config;
  this.count = 0;
  this.responseClients = [];

  if(config.attachToChemical) {
    this.on(config.attachToChemical, function(chemical){
      this.server = io.listen(chemical.data.server, config.socketio || {});
      this.emit(new Chemical("WebSocketServer", self));
      this.server.set("log level", config.logLevel || 0);
      this.server.sockets.on('connection', function(socket){ self.handleIncomingConnection(socket); });
    });
  }
  else
  if(config.port) {
    this.server = io.listen(config.port, config.socketio || {}, function(){
      self.emit(new Chemical("WebSocketServer", self));
    });
    this.server.set("log level", config.logLevel || 0);
    this.server.sockets.on('connection', function(socket){ self.handleIncomingConnection(socket); });
  }
  else
    throw new Error("Can't find attachToChemical or port in config", config);

  this.on("WebSocketServer", this.handleOutgoingMessage);

  this.on("kill", function(){
    if(this.server)
      this.server.server.close();
    return false;
  });
}

util.inherits(module.exports, Organel);

module.exports.prototype.handleIncomingConnection = function (connection) {
  
  this.emit(new Chemical("socketConnection", connection));

  var self = this;
  _.each(this.config.events, function(chemicalAddon, eventType) {
    connection.on(eventType, function(data, callback){ //XXX callback
      self.handleIncomingMessage(chemicalAddon, eventType, data, connection, callback); 
    });
  });

  connection.on('disconnect', function(){ 
    for(var i = 0; i<self.responseClients.length; i++) {
      if(self.responseClients[i].connection == connection) {
        self.responseClients.splice(i, 1);
        i -= 1;
      }
    }
    self.emit(new Chemical("socketClosed", connection)); 
  });
}

module.exports.prototype.handleIncomingMessage = function(chemicalAddons, event, data, connection, callback){

  var chemical = new Chemical();
  chemical.data = data;
  _.extend(chemical, JSON.parse(JSON.stringify(chemicalAddons))); // better way to do it?

  chemical.type = chemical.chain.shift();
  chemical.traceId = this.count++;
  
  chemical.connection = connection;
  chemical.callback = callback;

  if(callback)
    this.responseClients.push({ traceId: chemical.traceId, callback: callback, connection: connection });
  this.emit(chemical);
}

module.exports.prototype.handleOutgoingMessage = function(chemical) {
  for(var i = 0; i<this.responseClients.length; i++) {
    var client = this.responseClients[i];
    if(client.traceId == chemical.traceId) {
      client.callback(chemical.err, chemical.data);
      this.responseClients.splice(i, 1);
      return;
    }
  }
}