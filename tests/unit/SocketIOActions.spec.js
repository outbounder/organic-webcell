var SocketIOActions = require("../../plasma/SocketIOActions");
var Plasma = require("organic").Plasma;
var Chemical = require("organic").Chemical;

describe("SocketIOActions", function(){
  
  var plasma = new Plasma();
  var config = {
    cwd: {
      "actions": "/tests/data/io-actions",
      "actionHelpers": "/tests/data/io-action-helpers"
    }
  };
  var mockupIO = {
    on:function(){

    }
  }

  var lastSend;
  var mockRes = function() {
    lastSend = arguments;
  }

  var actions = new SocketIOActions(plasma, config);
  
  it("mounts actions to HttpServer properly", function(next){
    plasma.once("SocketIOActions", function(){
      expect(actions.actionsList.length).toBe(2);
      next();
    });
    plasma.emit(new Chemical({
      type: "WebSocketServer",
      data: {
        server: mockupIO
      }
    }));
  });

  it("mounted actions are working", function(next){
    actions.actionsList[0].handler({}, mockRes);
    expect(lastSend[0]).toBe(true);
    next();
  })

});