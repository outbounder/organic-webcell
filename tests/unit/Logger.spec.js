var Chemical = require("organic").Chemical;
var Logger = require("../../plasma/Logger");
var Plasma = require("organic").Plasma;

describe("Logger", function(){
  
  var plasma = new Plasma();
  var config = {
    "cwd": {
      root: "/tests/data/less/"
    },
    "listenUncaughtExceptions": true,
    "useClim": true,
    "useWinston": true
  };

  var logger = new Logger(plasma, config);

  it("should console log", function(next){
    plasma.emit(new Chemical({
      type: "Logger",
      test: true
    }), function(chemical){
      expect(chemical instanceof Error).toBe(false);
      next();
    });
  });

});