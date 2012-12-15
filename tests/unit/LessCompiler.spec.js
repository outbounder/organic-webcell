var Chemical = require("organic").Chemical;
var LessCompiler = require("../../plasma/LessCompiler");
var Plasma = require("organic").Plasma;
var fs = require("fs");

describe("LessCompiler", function(){
  
  var plasma = new Plasma();
  var config = {
    "pathToWatch": __dirname + "/../data/less/src/",
    "fileToCompile": __dirname + "/../data/less/src/main.less",
    "destination": __dirname + "/../data/less/build/styles.css"
  };
  var nameOfClass = ".my-new-style-" + (new Date().getTime());
  var style = nameOfClass + "{ color: #F00; .my-custom-style(); }";
  
  it("should change some of the less files", function(next){
    
    plasma.once("LessCompiled", function() {
      fs.exists(__dirname + "/../data/less/build/styles.css", function (exists) {
        expect(exists).toBe(true);
        fs.readFile(__dirname + "/../data/less/build/styles.css", "utf-8", function (err, data) {
          expect(err).toBe(null);
          expect(data).toBeDefined();
          expect(data).toContain(nameOfClass);
          next();
        });
      });
    });

    plasma.once("LessWatched", function() {
      fs.writeFile(__dirname + "/../data/less/src/header.less", style, function(err) {
        expect(err).toBe(null);
      });
    });

    var lessCompiler = new LessCompiler(plasma, config);

  });

});