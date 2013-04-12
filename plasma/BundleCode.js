var util = require("util");
var Organel = require("organic").Organel;
var Chemical = require("organic").Chemical;

var fs = require("fs");
var browserify = require('browserify');
var through = require("browserify/node_modules/through");
var jade = require('jade');

var jsp = require("uglify-js").parser
var pro = require("uglify-js").uglify

var _ = require("underscore");
var path = require("path");

module.exports = function BundleCode(plasma, config){
  Organel.call(this, plasma);

  var self = this;
  var cache = {};
  if(config.useCache)
    console.log("using code caching");
  
  if(config.cwd)
    for(var key in config.cwd)
      config[key] = process.cwd()+config.cwd[key];
  this.config = config;
  var root = this.config.root || process.cwd();
  
  this.on("BundleCode", function(chemical, sender, callback){

    var target = (chemical.root || config.root || "")+(chemical.code || config.code);
    if(target.indexOf(".js") === -1)
      target += ".js";
    
    if(cache[target] && config.useCache) {
      chemical.data = cache[target];
      return callback(chemical);
    }

    // combine
    var b = browserify();
    b.add(target);
    var pluginArgs = {
      through: through,
      bundle: b,
      stream: null
    };
    if(config.plugins) {
      config.plugins.forEach(function(pluginDna){
        var file = pluginDna.source;
        if(typeof pluginDna == "string")
          file = pluginDna;
        require(root+file)(pluginArgs, pluginDna);
      })
    }
    pluginArgs.stream = b.bundle(config, function(err, src){
      if(err) return callback(err);

      cache[target] = src;

      if(config.uglify) {
        ast = jsp.parse(cache[target])
        ast = pro.ast_mangle(ast)
        ast = pro.ast_squeeze(ast)
        cache[target] = pro.gen_code(ast)
      }
      cache[target] = new Buffer(cache[target]);
      chemical.data = cache[target];

      callback(chemical);
    });
  });
}

util.inherits(module.exports, Organel);