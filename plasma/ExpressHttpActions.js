var util = require("util");
var Organel = require("organic").Organel;
var glob = require('glob');
var path = require("path");
var _ = require("underscore");

module.exports = function HttpActions(plasma, config){
  Organel.call(this, plasma);
  
  this.config = config;

  // bootstrap all actions once httpserver is ready
  this.on("HttpServer", function(chemical, sender, callback){
    var app = chemical.data.app;
    var context = {};
    var self = this;

    if(config.cwd)
      for(var key in config.cwd)
        config[key] = process.cwd()+config.cwd[key];
    
    if(config.actionHelpers) {
      glob(config.actionHelpers+"/**/*.js", function(err, files){
        files.forEach(function(file){
          context[path.basename(file, path.extname(file))] = require(file);
        });
        self.loadActions(app, config, context, function(){
          if(callback) return callback();
          self.emit("HttpServerActions");
        });
      });
    } else 
      self.loadActions(app, config, context, function(){
        if(callback) return callback();
        self.emit("HttpServerActions");
      });

    return false;
  });
}

util.inherits(module.exports, Organel);

module.exports.prototype.loadActions = function(app, config, context, callback){
  var actionsRoot = config.actions.split("\\").join("/");
  var self = this;
  glob(actionsRoot+"/**/*.js", function(err, files){
    files.reverse();
    files.forEach(function(file){
      var url = file.replace("_", ":").split("\\").join("/").replace(actionsRoot, "");
      if(config.mount)
        url = config.mount+url;
      if(file.indexOf("/index.js") === -1)
        self.exportHttpActions(app, url.replace(".js", ""), require(file).call(context, config));
      else
        self.exportHttpActions(app, url.replace("/index.js", ""), require(file).call(context, config));
    });
    if(callback) callback();
  });
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

module.exports.prototype.registerAction = function(app, method, url, action) {
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
  switch(method) {
    case "GET":
      app.get.apply(app, args);
    break;
    case "POST":
      app.post.apply(app, args);
    break;
    case "PUT":
      app.put.apply(app, args);
    break;
    case "DELETE":
      app.del.apply(app, args);
    break;
    case "*":
      app.all.apply(app, args);
    break;
  }
};

module.exports.prototype.exportHttpActions = function(app, root, actions) {
  var root = actions.root || root;

  for(var key in actions) {
    if(key == "routes") {
      this.exportHttpActions(app, root,  actions.routes);
      continue;
    }

    var parts = key.split(" ");
    var method = parts.shift();
    var url = parts.pop();
    var actionHandler = actions[key];
    if(typeof actionHandler === "string") {
      actionHandler = actions[actionHandler];
      if(typeof actionHandler !== "function" && !Array.isArray(actionHandler))
        throw new Error(actionHandler+" was not found");
    }
    this.registerAction(app, method, root+(url?url:""), actionHandler);
  }
}