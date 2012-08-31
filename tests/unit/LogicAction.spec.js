var LogicAction = require("../../plasma/LogicAction");
var Plasma = require("organic").Plasma;
var Chemical = require("organic").Chemical;

describe("LogicAction", function(){
  
  var plasma = new Plasma();
  var config = {
    "apiEndpoint" : "http://something.com"
  };
  var pageData = new LogicAction(plasma, config);
  
  it("should invoke MockHandler on LogicAction chemical", function(next){
    
    plasma.once("step1", function(chemical){
      expect(chemical.data).toBeDefined();
      expect(chemical.chain[0]).toBe("step2");
      expect(chemical.data.test).toBe(config.apiEndpoint);
      next();
    });

    plasma.emit(new Chemical({
      type: "LogicAction",
      chain: ["step1", "step2"],
      action: "/tests/data/LogicAction"
    }));
  });  

  it("should invoke series of handlers on LogicAction chemical", function(next){
    plasma.once("step1", function(chemical){
      expect(chemical.data).toBeDefined();
      expect(chemical.chain[0]).toBe("step2");
      expect(chemical.data.test).toBe(config.apiEndpoint);
      expect(chemical.data.test2).toBe(config.apiEndpoint);
      next();
    });

    plasma.emit(new Chemical({
      type: "LogicAction",
      chain: ["step1", "step2"],
      action: ["/tests/data/LogicAction", "/tests/data/LogicAction2"]
    }));
  })

});