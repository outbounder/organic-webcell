var util = require("util");
var Organel = require("organic").Organel;
var Chemical = require("organic").Chemical;

var fs = require("fs");
var browserify = require('browserify');
var jade = require('jade');

var jsp = require("uglify-js").parser
var pro = require("uglify-js").uglify

var _ = require("underscore");

module.exports = function PageCode(plasma, config){
  Organel.call(this, plasma);

  var self = this;
  var cache = {};
  if(config.useCache)
    console.log("using code cache");
  
  this.on("PageCode", function(chemical, sender, callback){

    var target = process.cwd()+config.root+(chemical.code || config.code);
    
    if(cache[target] && config.useCache) {
      chemical.data = cache[target];
      return callback(chemical);
    }

    // combine
    b = browserify({debug: config.debug});
    b.register(".jade", function(body, file){
      var compiled = jade.compile(body, {
        filename: file
      })(_.extend({}, chemical.data, chemical.req.locals));
      var escaped = "module.exports = '"+compiled.replace(/[\']/g, "\\'").replace(/[\n]/g, "\\n")+"';";
      return escaped;
    });
    b.register(".raw", function(body, file){
      return "module.exports = '"+body.replace(/[\']/g, "\\'").replace(/[\n]/g, "\\n")+"';";
    });
    b.addEntry(target);
    cache[target] = b.bundle();
    
    if(config.uglify) {
      ast = jsp.parse(cache[target])
      ast = pro.ast_mangle(ast)
      ast = pro.ast_squeeze(ast)
      cache[target] = pro.gen_code(ast)
    }

    cache[target] = new Buffer(cache[target]);
    chemical.data = cache[target];
    chemical['content-type'] = "text/javascript";

    callback(chemical);
  });
}

util.inherits(module.exports, Organel);