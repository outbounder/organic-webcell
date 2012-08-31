var PageCode = require("../../plasma/PageCode");
var Plasma = require("organic").Plasma;
var Chemical = require("organic").Chemical;

describe("PageCode", function(){
  
  var plasma = new Plasma();
  var config = {
    "root": "/tests/data/client",
    "useCache": false,
    "code": "/index.js"
  };
  var mockChain = ["step1", "step2"];
  var mockRequest = { url: "myRequest", headers: {} };
  var mockResponse = { send: function(){} };

  var pageCode = new PageCode(plasma, config);
  
  it("should get user session on PageData chemical", function(next){
    
    plasma.once("step1", function(chemical){
      expect(chemical.data.toString()).toBeDefined();
      expect(chemical.data.toString()).toContain("index");
      expect(chemical.chain[0]).toBe("step2");
      next();
    });

    plasma.emit(new Chemical({
      type: "PageCode",
      chain: mockChain,
      req: mockRequest,
      res: mockResponse
    }));
  });  

});