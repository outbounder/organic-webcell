jasmine.DEFAULT_TIMEOUT_INTERVAL = 25000;

var ExpressHttpPages = require("../../plasma/ExpressHttpPages");
var Plasma = require("organic").Plasma;
var Chemical = require("organic").Chemical;
var fs = require("fs");

describe("ExpressHttpPages", function(){
  var bundleCodeInvoked = false;
  var bundleStyleInvoked = false;

  var plasma = new Plasma();
  var config = {
    cwd: {
      "pages": "/tests/data/http-pages",
      "pageHelpers": "/tests/data/http-page-helpers",
      "assetsBuildDir": "/tests/data/assets-storage"
    },
    debug: true,
    prebuildAssets: true
  };
  var mockupApp = {
    routes: {get:{}, put:{}, post:{}, del: {}, all: {}},
    get: function(url, action){
      this.routes.get[url] = action;
    },
    put: function(url, action){
      this.routes.put[url] = action;
    },
    post: function(url, action){
      this.routes.post[url] = action;
    },
    del: function(url, action){
      this.routes.del[url] = action;
    },
    all: function(url, action){
      this.routes.all[url] = action;
    }
  }

  plasma.on("RenderPage", function(c, sender, callback){
    c.data = true; 
    callback(c);
  })
  plasma.on("BundleCode", function(c, sender, callback){
    bundleCodeInvoked = true;
    c.data = "some code";
    setTimeout(function(){
      callback(c);
    }, 1000);
  });
  plasma.on("BundleStyle", function(c, sender, callback){
    bundleStyleInvoked = true;
    c.data = "some style";
    setTimeout(function(){
      callback(c);
    }, 1000);
  });

  var mockRes = {
    lastSend: null,
    lastError: null,
    send: function(body) {
      this.lastSend = body;
    },
    setHeader: function(){}
  }
  
  it("stores assets in assets-store dir", function(next){
    bundleCodeInvoked = false;
    bundleStyleInvoked = false;
    var pages = new ExpressHttpPages(plasma, config);
    plasma.once("ExpressHttpPagesAssetsPacks", function(c){
      expect(bundleStyleInvoked).toBe(true);
      expect(bundleCodeInvoked).toBe(true);
      for(var key in c.data)
        fs.unlink(c.data[key]);
      next();
    });
    plasma.emit(new Chemical({
      type: "HttpServer",
      data: {
        app: mockupApp
      }
    }));
  });
});