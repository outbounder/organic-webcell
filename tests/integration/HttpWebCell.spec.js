var Cell = require("../../WebCell");
var Chemical = require("organic").Chemical;

describe("ClientPage", function(){
  
  var cell;

  var mockRequest = { url: "myRequest", headers: {} };
  var mockResponse = { send: function(){} };

  var dnaData = {
    "membrane":{
      "HttpServer": {
        "source": "membrane/HttpServer",
        "port": 8079,
        "staticFolder": "/tests/data/client/public",
        "localesFolder": "/tests/data/client/public/locales",
        "routes":{
          "*": {
            "chain": [
              "HttpServer"
            ],
            "page": "/index"
          }
        },
      }
    },
    "plasma": {
      "PageRender": {
        "source": "plasma/PageRender",
        "root": "/tests/data/client"
      }
    }
  };

  it("should start", function(next){
    cell = new Cell(dnaData);
    cell.plasma.once("HttpServer", function(chemical){
      expect(chemical).toBeDefined();
      next();
    });
    cell.plasma.on(Error, function(e){
      throw e;
    })
  });

  it("should emit rendered page", function(next){
    cell.plasma.once("HttpServer", function(chemical){
      expect(chemical.data).toContain("<div class");
      expect(chemical.data).toContain("index");
      cell.kill();
      next();
    });

    cell.plasma.emit(new Chemical({
      type: "PageRender",
      req: mockRequest,
      res: mockResponse,
      chain: dnaData.membrane.HttpServer.routes["*"].chain,
      page: dnaData.membrane.HttpServer.routes["*"].page,
    }));
  });

});