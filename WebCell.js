#!/usr/bin/env node
var mode = process.env.CELL_MODE || "development";

var util = require("util");
var Cell = require("organic").Cell;
var Plasma = require("organic").Plasma;
var DNA = require("organic").DNA;
var Chemical = require("organic").Chemical;

module.exports = function WebDataCell(dna) {
  Plasma.apply(this);

  if(dna) {
    Cell.call(this, dna);
  } else {
    var self = this;
    dna = new DNA();
    dna.loadDir(process.cwd()+"/dna", function(){
      if(dna[mode])
        dna.mergeBranchInRoot(mode);
      Cell.call(self, dna);
      self.emit({type: "dna", data: dna});
    });
  }
}

util.inherits(module.exports, Cell);

module.exports.prototype.kill = function(){
  this.plasma.emit(new Chemical("kill"));
}

module.exports.prototype.on = function() {
  Plasma.prototype.on.apply(this, arguments);
}

module.exports.prototype.emit = function() {
  Plasma.prototype.emit.apply(this, arguments);
}

module.exports.prototype.off = function() {
  Plasma.prototype.off.apply(this, arguments);
}

module.exports.prototype.once = function() {
  Plasma.prototype.once.apply(this, arguments);
}

// start the cell if this file is not required
if(!module.parent) {
  console.log("creating WebCell in "+mode);
  new module.exports();
}