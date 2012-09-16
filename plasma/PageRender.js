var util = require("util");
var Organel = require("organic").Organel;
var Chemical = require("organic").Chemical;
var jade = require("jade");
var fs = require("fs");
var _ = require("underscore");

module.exports = function PageRender(plasma, config){
  Organel.call(this, plasma);
  var self = this;
  this.files = {};

  this.on("PageRender", function(chemical, sender, callback){

    if(!chemical.page) return callback(new Error("recieved PageRender chemical without page"));

    var renderData = {
      code: chemical.code
    };

    if(chemical.data)
      _.extend(renderData, chemical.data);
    if(chemical.req.locals)
      _.extend(renderData, chemical.req.locals);

    var target = process.cwd()+config.root+chemical.page+".jade";
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
        chemical.data = self.files[target](renderData)
        chemical['content-type'] = "text/html";
        callback(chemical);
      });
    } else {
      chemical.data = self.files[target](renderData)
      chemical['content-type'] = "text/html";
      callback(chemical);
    }
  });
}

util.inherits(module.exports, Organel);