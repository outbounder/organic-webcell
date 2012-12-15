var util = require("util");
var Organel = require("organic").Organel;

module.exports = function LessCompiler(plasma, config){

    var self = this;

    Organel.call(this, plasma);
    require("lesscompile").init(config).onCompile(function() {
        self.emit("LessCompiled");
    }).ready(function() {
        self.emit("LessWatched");
    });

}

util.inherits(module.exports, Organel);