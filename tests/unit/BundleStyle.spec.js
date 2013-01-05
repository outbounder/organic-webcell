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
  var nameOfClass = ".my-new-style-" + (new Date().getTime());
  var style = nameOfClass + "{ color: #F00; .my-custom-style(); }";

  var bundleStyle = new BundleStyle(plasma, config);
  
  it("should write css code in header.less", function(next) {
    fs.writeFile(__dirname + "/../data/less/src/header.less", style, function(err) {
      expect(err).toBe(null);
      next();
    });
  });

  it("should compile less with default config", function(next){
    plasma.emit(new Chemical({
      type: "BundleStyle",
      code: "index",
    }), function(chemical){
      expect(chemical).toBeDefined();
      expect(chemical.data).toContain(nameOfClass);
      next();
    });
  });

});