var util = require("util");
var Organel = require("organic").Organel;
var Chemical = require("organic").Chemical;

/* organel | 

Any Chemical which is instanceof == "Error" emitted to the plasma will be printed once the Organelle is created.

*/

/* incoming | Error

Any Chemical which is instanceof == "Error" emitted to the plasma will be printed once the Organelle is created.

*/

module.exports = function ErrorHandler(plasma){
  Organel.call(this, plasma);

  this.on(Error, function(chemical){
    console.log("ERROR:".red+chemical);
  });
}

util.inherits(module.exports, Organel);