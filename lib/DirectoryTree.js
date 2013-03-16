var util = require("util");
var glob = require('glob');
var path = require("path");
var _ = require("underscore");
var fs = require("fs");
var async = require('async');

module.exports = function DirectoryTree(){
}

module.exports.prototype.relativePath = function(file, root) {
  return file.split("\\").join("/").replace(root.split("\\").join("/"), "");
}

module.exports.prototype.urlizeTargetPath = function(file, root, config) {
  var url = this.relativePath(file, root).replace("_", ":");
  if(file.indexOf(config.indexName) === -1)
    url = url.replace(config.targetExtname, "");
  else
    url = url.replace("/"+config.indexName, "");
  if(config.mount)
    url = config.mount+url;
  return url;
}

module.exports.prototype.isIndexFile = function(filepath, extname){
  var indexfilename = "index"+extname;
  if(filepath.lastIndexOf(indexfilename) == (filepath.length-indexfilename.length))
    return true;
  return false;
}

module.exports.prototype.scan = function(config, targetMounter, callback) {
  var self = this;

  this.started = new Date((new Date()).toUTCString());

  var actionsRoot = config.targetsRoot;
  var self = this;
  glob(actionsRoot+"/**/*"+config.targetExtname, function(err, files){
    files.reverse().sort(function(a,b){
      if(self.isIndexFile(a,config.targetExtname))
        return -1;
      else
      if(self.isIndexFile(b,config.targetExtname))
        return 1;
      else
        return a - b;
    })
    async.forEach(files, function(file, next){
      if(config.excludePattern && file.match(config.excludePattern))
        return next();
      var url = self.urlizeTargetPath(file, actionsRoot, config)
      targetMounter(file, url, next);
    }, function(){
      if(callback) callback();  
    });
  });
}

