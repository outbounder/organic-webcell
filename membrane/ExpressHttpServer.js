var util = require("util");
var express = require('express');
var _ = require("underscore");
var fs = require("fs");

var Chemical = require("organic").Chemical;
var Organel = require("organic").Organel;

module.exports = function ExpressHttpServer(plasma, config){
  Organel.call(this, plasma);

  // TODO get rid of express and use pure HTTPServer from node for perfomance...
  var app = this.app = express();
  this.responseClients = [];
  this.count = 0;
  this.config = config;
  var self = this;

  this.mountMiddleware();
  this.app.use(this.app.router);
  this.mountHttpRoutes();
  
  this.on("HttpServer", this.handleIncomingResponse);
  this.once("kill", this.close);

  config.port = config.port || 1337;

  this.server = app.listen(config.port, function(){
    console.log('HttpServer running at http://127.0.0.1:'+config.port+'/');  
    self.emit(new Chemical("HttpServer", self));
  });
  
}

util.inherits(module.exports, Organel);

module.exports.prototype.mountMiddleware = function(){
  var self = this;
  _.each(this.config.middleware, function(middleware){
    
    var middlewareSource = middleware.source || middleware;
    var middlewareConfig = middleware.source?middleware:{};
    if(middlewareSource.indexOf("/") !== 0)
      middlewareSource = process.cwd()+"/"+middlewareSource;
    
    if(self.config.logMiddleware)
      console.log("middleware: ",middlewareSource, JSON.stringify(middlewareConfig).yellow);
    var middlewareFunc = require(middlewareSource)(middlewareConfig, self);
    if(middlewareFunc)
      self.app.use(middlewareFunc);
  });
}

module.exports.prototype.mountHttpRoutes = function(){
  var self = this;
  _.each(this.config.routes, function(chemicalAddons, path){
    if(self.config.logRoutes)
      console.log("route: ",path.green, JSON.stringify(chemicalAddons).yellow);
    self.app.all(path, function(req, res){ self.handleIncomingRequest(chemicalAddons, req, res); });  
  });

  if(this.config.notfoundRoute) {
    this.app.all("*", function(req, res){
      self.handleIncomingRequest(self.config.notfoundRoute, req, res);
    });
  }
}

module.exports.prototype.handleIncomingRequest = function(chemicalAddons, req, res){
  var chemical = new Chemical();
  
  chemical.traceId = this.count++;
  chemical.req = req;
  chemical.res = res;
  _.extend(chemical, JSON.parse(JSON.stringify(chemicalAddons))); // better way to do it?
  chemical.type = chemical.chain.shift();

  // store incoming req, res to be able to respond on httpResponse chemical.
  this.responseClients.push({req: req, res: res, traceId: chemical.traceId});

  // finally emit to the plasma
  this.emit(chemical);
}

module.exports.prototype.handleIncomingResponse =  function(chemical){
  for(var i = 0; i<this.responseClients.length; i++) {
    var client = this.responseClients[i];
    if(chemical.traceId == client.traceId) {
      if(chemical['content-type'])
        client.res.set('Content-type', chemical['content-type']);
      if(chemical.data instanceof Buffer) {
        client.res.write(chemical.data);
        client.res.end();
      } else {
        client.res.send(chemical.data, chemical.statusCode || 200);
      }
      this.responseClients.splice(i,1);
      return;
    }
  }
  return false;
};

module.exports.prototype.close = function(chemical){
  this.server.close();
  return false;
}