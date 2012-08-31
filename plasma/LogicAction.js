var util = require("util");
var Organel = require("organic").Organel;
var Chemical = require("organic").Chemical;

module.exports = function LogicAction(plasma, config){
  Organel.call(this, plasma);

  this.config = config;

  this.on(config.handleChemicalType || "LogicAction", function(chemical){
    if(!chemical.chain) { this.emit(new Error("recieved LogicAction chemical without chain")); return; }

    var dataLogic = chemical.action;
    
    chemical.type = chemical.chain.shift();

    var self = this;
    if(Array.isArray(dataLogic)) {
      var next = function(){
        var handler = dataLogic.shift();
        if(handler) {
          handler = require(process.cwd()+handler);
          handler.call(self, chemical, next);
        } else
          self.emit(chemical);
      }
      next();
    } else {
      dataLogic = require(process.cwd()+dataLogic);
      dataLogic.call(this, chemical, function(){
        self.emit(chemical);
      });
    }
  });
}

util.inherits(module.exports, Organel);