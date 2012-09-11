var root = "../../../";
var Chemical = require("organic").Chemical;
var Plasma = require("organic").Plasma;
var HttpServer = require(root+"membrane/ExpressHttpServer");
var LogicAction = require(root+"plasma/LogicAction");
var request = require("request");

var plasma = new Plasma();
var config = {
  "port": 8085,
  "routes": {
    "/myMessage": {
      "chain": ["LogicAction", "HttpServer"],
      "action": "/tests/data/HttpAction"
    }
  }
}

var logicActionConfig = {
  "dbname": "content"
}

var server;
var logicAction;

describe("HttpLogicAction", function(){

  it("should create new instance", function(){
    server = new HttpServer(plasma, config);
    logicAction = new LogicAction(plasma, logicActionConfig);
    expect(server).toBeDefined();
    expect(logicAction).toBeDefined();
  });

  it("should handle incoming request", function(next){
    request("http://127.0.0.1:"+config.port+"/myMessage", function(err, res, body){
      expect(body).toBe("content");
      next();
    });
  });

  it("should close on receiving kill", function(){
    plasma.emit(new Chemical("kill"));
  })
});