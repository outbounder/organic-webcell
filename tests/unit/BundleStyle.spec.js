var Chemical = require("organic").Chemical;
var BundleStyle = require("../../plasma/BundleStyle");
var Plasma = require("organic").Plasma;
var fs = require("fs");

describe("BundleStyle", function(){
  
  var plasma = new Plasma();
  var config = {
    less: {
      pathToWatch: __dirname + "/../data/less/src/",
      fileToCompile: __dirname + "/../data/less/src/main.less",
      destination: __dirname + "/../data/less/build/styles.css",
      watchForChanges: false
    }
  };

  var bundleStyle = new BundleStyle(plasma, config);

  it("should compile less with default config", function(next){
    plasma.emit(new Chemical({
      type: "BundleStyle",
      code: "index",
    }), function(chemical){
      expect(chemical).toBeDefined();
      expect(chemical.data).toContain(".my-new-style");
      expect(chemical.data).toContain(".footer");
      expect(chemical.data).toContain(".footer {\n  margin: 10px;\n  display: block;");
      fs.unlink(__dirname + "/../data/less/build/styles.css");
      next();
    });
  });

});