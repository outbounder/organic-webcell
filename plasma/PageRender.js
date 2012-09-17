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
  this.on("PageRender", function(chemical){

    if(!chemical.chain) { this.emit(new Error("recieved PageRender chemical without chain")); return; }
    if(!chemical.page) { this.emit(new Error("recieved PageRender chemical without page, check dna @membrane.httpServer routes")); return; }

    chemical.type = chemical.chain.shift();

    var renderData = {
      code: chemical.code
    };
    _.extend(renderData, chemical.req);

    if(chemical.data)
      _.extend(renderData, chemical.data);

    var target = process.cwd()+config.root+chemical.page+".jade";
    if(!self.files[target] || !config.useCache){
      fs.readFile(target, function(err, fileData){
        if(err){
          err.message += " while trying to render "+chemical.page;
          self.emit(err);
          return;
        }
        self.files[target] = jade.compile(fileData, {
          filename: target
        });
        chemical.data = self.files[target](renderData)
        chemical['content-type'] = "text/html";
        self.emit(chemical);
      });
    } else {
      chemical.data = self.files[target](renderData)
      chemical['content-type'] = "text/html";
      self.emit(chemical);
    }
  });
}

util.inherits(module.exports, Organel);