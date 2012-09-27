var util = require("util");
var Organel = require("organic").Organel;
var Chemical = require("organic").Chemical;
var jade = require("jade");
var fs = require("fs");
var _ = require("underscore");

module.exports = function RenderPage(plasma, config){
  Organel.call(this, plasma);
  var self = this;
  this.files = {};

  this.on("RenderPage", function(chemical, sender, callback){

    var target = process.cwd()+(chemical.root || config.root)+(chemical.page || config.page)+".jade";
    if(!self.files[target] || !config.useCache){
      fs.readFile(target, function(err, fileData){
        if(err){
          err.message += " while trying to render "+chemical.page;
          callback(err);
          return;
        }
        self.files[target] = jade.compile(fileData, {
          filename: target
        });
        chemical.data = self.files[target](chemical);
        callback(chemical);
      });
    } else {
      chemical.data = self.files[target](chemical)
      callback(chemical);
    }
  });
}

util.inherits(module.exports, Organel);