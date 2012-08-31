#!/usr/bin/env node
var mode = process.env.CELL_MODE || "development";

var util = require("util");
var Cell = require("organic").Cell;
var DNA = require("organic").DNA;
var Chemical = require("organic").Chemical;

module.exports = function WebDataCell(dna) {
  if(dna) {
    Cell.call(this, dna);
  } else {
    var self = this;
    dna = new DNA();
    dna.loadDir(process.cwd()+"/dna", function(){
      if(dna[mode])
        dna.mergeBranchInRoot(mode);
      Cell.call(this, dna);
    });
  }
}

util.inherits(module.exports, Cell);

module.exports.prototype.kill = function(){
  this.plasma.emit(new Chemical("kill"));
}

// start the cell if this file is not required
if(!module.parent) {
  console.log("creating WebCell in "+mode);
  new module.exports();
}