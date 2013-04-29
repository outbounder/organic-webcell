var util = require("util");
var Organel = require("organic").Organel;
var glob = require('glob');
var path = require("path");
var _ = require("underscore");

var Actions = require("../lib/Actions");
var Context = require("../lib/Context");
var DirectoryTree = require("../lib/DirectoryTree");

/* organel | 

The Organelle is responsible for mounting Http Routes to the express app wrapped by ExpressHttpServer organelle or any other implementation providing the same interface.

It is roughly described in [wisdom about ExpressHttpActions](http://wisdom.camplight.net/wisdom/5110e488c489a7ef6d000043/Organic---ExpressHttpActions) 

* `mount`: String

  *optional* value to be used for prefixing all routes. Useful for mounting all actions found to specific root url

* `cwd`: Object

  * optional * , Object containing key:value pairs, where all values will be prefixed with `process.cwd()` and set with their coressponding keys directly to the DNA of the organelle.

* `actions`: String

  provided full path to directory containing `actions` defined within javascript files with the following source code definition:

        module.exports = function(config) {
          return {
            "*": function(req, res, next) {},
            "GET": function(req, res, next) {},
            "POST": function(req, res, next) {}, 
            "PUT": function(req, res, next) {}, 
            "DELETE": function(req, res, next) {}, 
            "OPTIONS": function(req, res, next) {}
          }
        }

* `actionHelpers`: String

  provided full path to directory containing `actionHelpers` defined within commonjs modules. Any exports from them will be attached to context of the `actions` within object with the same name as the corresponding action helper.

* `log`: false

  will print any found action routes to the stdout

*/

/* incoming | HttpServer

* data - ExpressHttpServer instance

*/

module.exports = function ExpressHttpActions(plasma, config){
  Organel.call(this, plasma);

  var context = {
    plasma: this.plasma
  };
  var self = this;

  if(config.cwd)
    for(var key in config.cwd)
      config[key] = process.cwd()+config.cwd[key];
  
  this.config = config;

  this.on("HttpServer", function(chemical){
    var app = chemical.data.app;
    if(config.actionHelpers) {
      Context.scan({
        root: config.actionHelpers,
        extname: ".js"
      }, context, function(err){
        self.mountActions(app, config, context, function(){
          self.emit("ExpressHttpActions", self);
        });
      })
    } else 
      self.mountActions(app, config, context, function(){
        self.emit("ExpressHttpActions", self);
      });
    return false;
  });
}

util.inherits(module.exports, Organel);

module.exports.prototype.mountActions = function(app, config, context, callback){
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
      self.mountAction(app, method, url, handler);
    });
    next();
  }, callback);
}

var request = function(req) {
};
var response = function(res) {
  res.result = function(data) {
    res.send({result: data});
  }
  res.success = function(result){
    res.send({result: result});
  }
  res.error = function(err){
    res.send({result: err}, 500);
  }
};

module.exports.prototype.mountAction = function(app, method, url, action) {
  if(url == "")
    url = "/";
  var args = [url];
  if(Array.isArray(action)) {
    _.each(action, function(a){
      args.push(function(req, res, next){
        request(req);
        response(res);
        a(req, res, next);
      });
    });
  } else {
    args.push(function(req, res, next){
      request(req);
      response(res);
      action(req, res, next);
    });
  }
  
  if(this.config.log)
    console.log("action", method, url);
  
  if(method == "*")
    app.all.apply(app, args);
  else
  if(method == "DELETE")
    app.del.apply(app, args);
  else
    app[method.toLowerCase()].apply(app, args);
};