var LogicAction = require("../../plasma/LogicAction");
var Plasma = require("organic").Plasma;
var Chemical = require("organic").Chemical;

describe("LogicAction", function(){
  
  var plasma = new Plasma();
  var config = {
    "apiEndpoint" : "http://something.com"
  };
  
  var logicAction = new LogicAction(plasma, config);
  
  it("should invoke MockHandler on LogicAction chemical", function(next){
    plasma.emit(new Chemical({
      type: "LogicAction",
      action: "/tests/data/LogicAction"
    }), function(chemical){
      expect(chemical.data).toBeDefined();
      expect(chemical.data.test).toBe(config.apiEndpoint);
      next();
    });
  });  

  it("should invoke series of handlers on LogicAction chemical", function(next){
    plasma.emit(new Chemical({
      type: "LogicAction",
      action: ["/tests/data/LogicAction", "/tests/data/LogicAction2"]
    }), function(chemical){
      expect(chemical.data).toBeDefined();
      expect(chemical.data.test).toBe(config.apiEndpoint);
      expect(chemical.data.test2).toBe(config.apiEndpoint);
      next();
    });
  })

});