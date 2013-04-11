var BundleCode = require("../../plasma/BundleCode");
var Plasma = require("organic").Plasma;
var Chemical = require("organic").Chemical;
var path = require("path");

describe("BundleCode", function(){
  
  var plasma = new Plasma();
  var config = {
    "cwd": {
      "root": "/tests/data"
    },
    "useCache": false,
    "debug": false,
    "plugins": ["/client-plugins/plugin"]
  };

  var bundleCode = new BundleCode(plasma, config);
  
  it("should compile with transformation", function(next){
    plasma.emit(new Chemical({
      type: "BundleCode",
      code: "/client/indexPluggins",
    }), function(chemical){
      expect(chemical.data.toString()).toBeDefined();
      expect(chemical.data.toString()).toContain("index");
      expect(chemical.data.toString()).toContain("test1");
      expect(chemical.data.toString()).toContain("test2");
      expect(chemical.data.toString()).toContain("test3");
      next();
    });
  });

});