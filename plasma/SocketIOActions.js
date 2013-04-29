var util = require("util");
var Organel = require("organic").Organel;
var path = require("path");
var _ = require("underscore");

var Actions = require("../lib/Actions");
var Context = require("../lib/Context");
var DirectoryTree = require("../lib/DirectoryTree");

/* organel | 

The Organelle is responsible for mounting Web Socket Message Handlers to the socketio wrapped by WebSocketServer organelle or any other implementation providing the same interface.

* `mount`: String

  *optional* value to be used for prefixing all routes. Useful for mounting all actions found to specific root url

* `cwd`: Object

  * optional * , Object containing key:value pairs, where all values will be prefixed with `process.cwd()` and set with their coressponding keys directly to the DNA of the organelle.

* `actions`: String

  provided full path to directory containing `actions` defined within javascript files with the following source code definition:

        module.exports = function(config) {
          return {
            "*": function(data, callback, socket) {},
            "GET": function(data, callback, socket) {},
            "POST": function(data, callback, socket) {},
            "PUT": function(data, callback, socket) {},
            "DELETE": function(data, callback, socket) {},
            "OPTIONS": function(data, callback, socket) {},
          }
        }

* `log`: false

  will print any found action routes to the stdout

*/

/* incoming | WebSocketServer

* data - WebSocketServer instance

*/

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
        console.log("io action", method + " " + url);
      self.actionsList.push({ event: method + " " + url, handler: handler});
    });
    next();
  }, callback);
}