var util = require("util");
var Organel = require("organic").Organel;
var path = require("path");
var less = require("less");
var fs = require("fs");

/* incoming | BundleStyle

* `style` - String

  **required**, given value should map to fullpath to the entry point of the style to be generated using less compiler

  * if BundleStyle organelle is configured with `root` option, it will be prepended to the style variable

  * if BundleStyle incoming chemical contains `root` variable, it will be prepended to the style variable

* `root` - String, optional

  *optional*, value to be prepended to the style path

* `styleType` - String, optional

  if not provided, extname of the `style` will be used. This option indicates the type of the parser to be used. Currently only Less is supported.

* `less` - Object, optional

  configuration options for Less compiler. If not provided less configuration from the Organelle will be used or its defaults.

  possible values

    * paths - Array of paths, by default the root folder of `style` is injected first
    * optimization
    * rootpath
    * relativeUrls
    * strictImports
    * dumpLineNumbers
    * compress
    * yuicompress
    * output - String, fullpath to where the compiled bundle should be written


## Response Chemical Structure ##

  * data - `true` when bundle should be written to file or compiled bundle contents

*/



/* organel | 

* `root` - String
* `less` - Object, Less Options

  configuration options for Less compiler, possible values:

    * paths - Array of paths, by default the root folder of `style` is injected first
    * optimization - 1
    * rootpath 
    * relativeUrls - false
    * strictImports - false
    * dumpLineNumbers - false
    * compress - false
    * yuicompress - false
    * output - String undefined, fullpath to where the compiled bundle should be written

* `styleType` - String, autodetected from extension
* `style` - String 

*/
module.exports = function BundleStyle(plasma, config){

    var self = this;

    Organel.call(this, plasma);
    var cache = {};
    if(config.useCache)
        console.log("using style caching");

    if(config.cwd)
      for(var key in config.cwd)
        config[key] = process.cwd()+config.cwd[key];
    this.config = config;
    this.on("BundleStyle", function(chemical, sender, callback) {
        
        var target = (chemical.root || config.root || "")+(chemical.style || config.style);
        if(target.indexOf(".less") === -1)
            target += ".less";

        // get the type of the bundle by chemical, config or extension name of the target
        var type = chemical.styleType || config.styleType || path.extname(target);

        if((chemical.useCache || config.useCache) && cache[target]) {
            chemical.data = cache[target];
            callback(chemical);
        } else {
            switch(type) {
                case ".less":
                    var lessConfig = chemical.less || config.less || {};
                    lessConfig.rootpath = path.dirname(target);
                    fs.readFile(target, 'utf8', parseLessFile(target, lessConfig, function(err, css){
                        if(err) {
                            err.message += " while trying to parse "+target;
                            throw err;
                        }
                        chemical.data = cache[target] = css;
                        callback(chemical);
                    }));
                break;
                default:
                    callback(new Error("unrecognized style bundle type requested"));
                break;
            }
        }
    });

}

var parseLessFile = function(input, options, callback){
    return function (e, data) {
        if(e) return callback(e);

        new(less.Parser)({
            paths: [path.dirname(input)].concat(options.paths || []),
            optimization: options.optimization || 1,
            filename: input,
            rootpath: options.rootpath,
            relativeUrls: options.relativeUrls || false,
            strictImports: options.strictImports || false,
            dumpLineNumbers: options.dumpLineNumbers || false
        }).parse(data, function (err, tree) {
            if (err) throw err;
            var css = tree.toCSS({
                compress: options.compress || false,
                yuicompress: options.yuicompress || false
            });
            if (options.output) {
                fs.writeFileSync(options.output, css, 'utf8');
                callback(err, true);
            } else {
                callback(err, css);
            }
        });
    };
}

util.inherits(module.exports, Organel);