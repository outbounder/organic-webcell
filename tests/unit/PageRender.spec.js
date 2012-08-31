var PageRender = require("../../plasma/PageRender");
var Plasma = require("organic").Plasma;
var Chemical = require("organic").Chemical;

describe("PageRender", function(){
  
  var plasma = new Plasma();
  var config = {
    "root": "/tests/data/client"
  };
  var mockChain = ["step1", "step2"];
  var mockRequest = { url: "myRequest", headers: {} };
  var mockResponse = { send: function(){} };

  var pageRender = new PageRender(plasma, config);
  
  it("should get user session on PageData chemical", function(next){
    
    plasma.once("step1", function(chemical){
      expect(chemical.data).toBeDefined();
      expect(chemical.data).toContain("index");
      expect(chemical.chain[0]).toBe("step2");
      next();
    });

    plasma.emit(new Chemical({
      type: "PageRender",
      chain: mockChain,
      req: mockRequest,
      res: mockResponse,
      page: "/index"
    }));
  });  

});