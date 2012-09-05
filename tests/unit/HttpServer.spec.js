var HttpServer = require("../../membrane/HttpServer");
var Plasma = require("organic").Plasma;
var request = require("request");

describe("HttpServer", function(){
  
  var plasma = new Plasma();
  
  var httpServer;
  var serverConfig = {
    "port": 8080,
    "routes": {
      "/": {
        "chain": [
          "step1",
          "step2"
        ]
      }
    },
    "notfoundRoute": {
      "chain": [
        "notFound",
        "step2"
      ]
    }
  };
  var mockRequest = { url: "myRequest" };
  var mockResponse = { send: function(){} };

  it("should emit HttpServer chemical in plasma once ready", function(next){

    plasma.once("HttpServer", function(chemical){
      expect(chemical.data).toBe(httpServer);
      next();
    });

    httpServer = new HttpServer(plasma, serverConfig);
    expect(httpServer).toBeDefined();
  });

  it("should emit chemical 1 from chain on incoming request", function(next){
    plasma.once("step1", function(chemical){
      expect(chemical.req).toBeDefined();
      expect(chemical.req.url).toBe("myRequest");
      expect(chemical.traceId).toBe(0);
      expect(chemical.chain.length).toBe(1);
      expect(serverConfig.routes['/'].chain.length).toBe(2);
      next();
    });
    // mock req & res
    httpServer.handleIncomingRequest(serverConfig.routes["/"], mockRequest, mockResponse);
  });

  it("should emit chemical notfound from chain on not found route for request", function(next){
    plasma.once("notFound", function(chemical){
      expect(chemical.req).toBeDefined();
      expect(chemical.req.url).toBe("myRequest");
      expect(chemical.traceId).toBe(1);
      expect(chemical.chain.length).toBe(1);
      expect(serverConfig.notfoundRoute.chain.length).toBe(2);
      next();
    });

    // mock req & res
    httpServer.handleIncomingRequest(serverConfig.notfoundRoute, mockRequest, mockResponse);
  });

  it("should send response on HttpServer chemical", function(next){
    mockResponse.send = function(data) {
      expect(data).toBe("responseData");
      if(httpServer)
        httpServer.close();
      next();
    }
    plasma.emit({ type: "HttpServer", traceId: 0, data: "responseData" });
  });

});