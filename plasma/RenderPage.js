var util = require("util");
var Organel = require("organic").Organel;
var Chemical = require("organic").Chemical;
var jade = require("jade");
var fs = require("fs");
var _ = require("underscore");

/* organel | 

Organelle responsible for rendering given page template as html. It wraps `jade` template engine to do so.


* `cwd` - Object

  *optional* object containing key:values, where values will be prefixed with `process.cwd()` and placed within config itself with coresponding keys

  Useful to provide `root` value relative to current working directory

* `root` - String

  *optional*, represents the root value to be added in forming page template path.

* `useCache` - false

  Will instruct compiling the template to memory and further use it without any disk IO.

* `page` - String

  *optional*, represents the default page template path to be used if missing in incoming chemicals*/

/* incoming | RenderPage

When receiving such chemical the organelle will use it to render the template specified as path within the `page` attribute.  The chemical will be passed as data to the template, so any of its properties will be directly accessible in the template.

* `page` - String
* `root` - String

  *optional*

*/

module.exports = function RenderPage(plasma, config){
  Organel.call(this, plasma);
  var self = this;
  this.files = {};
  if(config.useCache)
    console.log("using page template caching");

  if(config.cwd)
    for(var key in config.cwd)
      config[key] = process.cwd()+config.cwd[key];

  this.config = config;

  this.on("RenderPage", function(chemical, sender, callback){
    var target = (chemical.root || config.root || "")+(chemical.page || config.page);
    if(target.indexOf(".jade") === -1)
      target += ".jade";

    if(!self.files[target] || !config.useCache){
      fs.readFile(target, function(err, fileData){
        if(err){
          err.message += " while trying to render "+target;
          throw err;
        }
        self.files[target] = jade.compile(fileData, _.extend({
          filename: target
        }, chemical.jadeConfig || config.jadeConfig || {}));
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