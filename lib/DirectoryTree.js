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

module.exports.prototype.sortFiles = function(files, extname, skipPlaceholders) {
  var indexes = _.filter(files, function(file){ 
    return file.indexOf("index"+extname) != -1 && (file.indexOf("_") === -1 || skipPlaceholders)
  }).sort(function(a, b){
    if(a.length > b.length) return 1;
    if(a.length < b.length) return -1;
    return 0;
  })
  placeholders = [];
  if(!skipPlaceholders) {
    placeholders = _.filter(files, function(file){ 
      return file.indexOf("_") != -1 
    });
    placeholders = this.sortFiles(placeholders, extname, true);
  }
  var others = _.difference(files, indexes, placeholders);
  return [].concat(indexes, others, placeholders);
}

module.exports.prototype.scan = function(config, targetMounter, callback) {
  var self = this;

  this.started = new Date((new Date()).toUTCString());

  var actionsRoot = config.targetsRoot;
  var self = this;
  glob(actionsRoot+"/**/*"+config.targetExtname, function(err, files){
    files = self.sortFiles(files, config.targetExtname);
    async.forEach(files, function(file, next){
      if(typeof config.excludePattern == "string")
        if(file.match(config.excludePattern))
          return next();
      else
      if(Array.isArray(config.excludePattern))
        for(var i = 0; i<config.excludePattern.length; i++)
          if(file.match(config.excludePattern[i]))
            return next();
      var url = self.urlizeTargetPath(file, actionsRoot, config)
      targetMounter(file, url, next);
    }, function(){
      if(callback) callback();  
    });
  });
}

