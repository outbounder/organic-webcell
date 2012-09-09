xdescribe("RelationBackboneMongo", function(){
  var Plasma = new require("organic").Plasma;
  var plasma = new Plasma();

  var Backbone = require('backbone');
  require("backbone-callbacks").attach(Backbone);
  require("../../utils/server/MongoBackbone").attach(Backbone, plasma);
  require("../../utils/RelationalBackbone").attach(Backbone);

  it("define MongoModel", function(){});
  it("create instance of MongoModel", function(){});
  it("save mongoModel instance with new relations", function(){});
  it("save mongoModel instance with relations updated", function(){});
  it("fetch mongoModel by id with relations", function(){});
  it("destroy mongoModel instance and its relations", function(){});
});
