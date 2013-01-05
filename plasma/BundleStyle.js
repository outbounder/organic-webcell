var util = require("util");
var Organel = require("organic").Organel;
var cache = {};

module.exports = function BundleStyle(plasma, defaultConfig){

    var self = this;

    Organel.call(this, plasma);

    this.on("BundleStyle", function(chemical, sender, callback) {
        var config = chemical.config || defaultConfig;
        var useCache = typeof config.useCache === "undefined" ? true : config.useCache;
        if(useCache && cache[config.fileToCompile]) {
            chemical.data = cache[config.fileToCompile];
            callback(chemical);
        } else {
            for(var type in config) {
                switch(type) {
                    case "less":
                        require("lesscompile").init(config.less).onCompile(function(css) {
                            chemical.data = cache[config.fileToCompile] = css;
                            callback(chemical);
                        });
                    break;
                    default:
                        callback();
                    break;
                }
            }
        }
    });

}

util.inherits(module.exports, Organel);