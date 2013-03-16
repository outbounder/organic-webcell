var util = require("util");
var Organel = require("organic").Organel;
var path = require("path");
var _ = require("underscore");

var Actions = require("../lib/Actions");
var Context = require("../lib/Context");
var DirectoryTree = require("../lib/DirectoryTree");

module.exports = function SocketIOActions(plasma, config){
  Organel.call(this, plasma);

  var context = {
    plasma: this.plasma
  };
  var self = this;
  
  if(config.cwd)
    for(var key in config.cwd)
      config[key] = process.cwd()+config.cwd[key];
  
  this.config = config;
  
  self.actionsList = [];

  // bootstrap all actions once io is ready
  this.on("WebSocketServer", function(chemical, sender, callback){
    var io = chemical.data.server;
    if(config.actionHelpers) {
      Context.scan({
        root: config.actionHelpers,
        extname: ".js"
      }, context, function(err){
        self.mountActions(io, config, context, function(){
          self.emit("SocketIOActions", self);
        });
      })
    } else 
      self.mountActions(io, config, context, function(){
        self.emit("SocketIOActions", self);
      });
    io.on("connection", function(socket){
      self.actionsList.forEach(function(a){
        socket.on(a.event, function(data, callback){
          a.handler(data, callback, socket);
        });
      })
    })
    return false;
  });
}

util.inherits(module.exports, Organel);

module.exports.prototype.mountActions = function(io, config, context, callback){
  var self = this;
  var actionsRoot = config.actions;
  self.actions = new DirectoryTree();
  self.actions.scan({
    targetsRoot: actionsRoot,
    targetExtname: ".js",
    mount: config.mount,
    indexName: "index.js"
  }, function(file, url, next){
    Actions.map(require(file).call(context, config), url, function(method, url, handler){
      if(Array.isArray(handler))
        throw new Error("not supported")
      if(self.config.log)
        console.log("io action", method + " " url);
      self.actionsList.push({ event: method + " " + url, handler: handler});
    });
    next();
  }, callback);
}