var PageRender = require("../../plasma/PageRender");
var Plasma = require("organic").Plasma;
var Chemical = require("organic").Chemical;

describe("PageRender", function(){
  
  var plasma = new Plasma();
  var config = {
    "root": "/tests/data/client"
  };
  var mockRequest = { url: "myRequest", headers: {} };
  var mockResponse = { send: function(){} };

  var pageRender = new PageRender(plasma, config);
  
  it("should get user session on PageData chemical", function(next){
    plasma.emit(new Chemical({
      type: "PageRender",
      req: mockRequest,
      res: mockResponse,
      page: "/index"
    }), function(chemical){
      expect(chemical.data).toBeDefined();
      expect(chemical.data).toContain("index");
      next();
    });
  });  

});