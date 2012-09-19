var util = require("util");
var Organel = require("organic").Organel;
var Chemical = require("organic").Chemical;

module.exports = function CallChain(plasma, config){
  Organel.call(this, plasma);

  this.config = config;

  this.on(config.handleChemicalType || "CallChain", function(chemical, sender, callback){
    var chain = chemical.chain;
    var index = 0;
    var lastChemical;
    var self = this;

    var emitNext = function(){
      var data = chain[index++];

      if(data) {
        var chemical = new Chemical(data);
        
        if(lastChemical) {
          chemical.req = chemical.req || {};
          chemical.req[lastChemical.type] = lastChemical.data;
        }
        
        self.emit(chemical, function(c){
          lastChemical = c;
          emitNext();
        });
      } else
        callback(lastChemical);
    }
    
    emitNext();
  });
}

util.inherits(module.exports, Organel);