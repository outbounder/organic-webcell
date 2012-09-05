var HttpServer = require("../../membrane/HttpServer");
var Plasma = require("organic").Plasma;
var request = require("request");
var path = require("path");
var fs = require("fs");
var _ = require("underscore");

describe("HttpServer", function(){
  
  var plasma = new Plasma();
  
  var httpServer;
  var serverConfig = {
    "port": 8090,
    "middleware": [
      "membrane/httpServerMiddleware/handleRequest",
      { "source": "membrane/httpServerMiddleware/handleUpload", "uploadDir": "tests/data/" },
      { "source": "membrane/httpServerMiddleware/handleI18Next", "localesDir": "tests/data/" },
      { "source": "membrane/httpServerMiddleware/staticFolder", "staticDir": "tests/data/" }
    ],
    "routes": {
      "/upload": {
        chain: ["EchoIncomingHttpRequest", "HttpServer"]
      }
    }
  };

  plasma.on("EchoIncomingHttpRequest", function(chemical){
    chemical.type = chemical.chain.shift();
    chemical.data = _.extend(chemical.data || {}, {
      body: chemical.req.body,
      params: chemical.req.params,
      files: chemical.req.files
    });
    plasma.emit(chemical);
  });

  it("should emit HttpServer chemical in plasma once ready", function(next){

    plasma.once("HttpServer", function(chemical){
      expect(chemical.data).toBe(httpServer);
      next();
    });

    httpServer = new HttpServer(plasma, serverConfig);
    expect(httpServer).toBeDefined();
  });

  it("should serve files from public folder", function(next){
    request("http://127.0.0.1:"+serverConfig.port+"/file.txt", function(err, res, body){
      expect(body).toBe("content");
      next();
    });
  });

  it("should handle uploading of files to public folder", function(next){
    var r = request.post('http://127.0.0.1:'+serverConfig.port+'/upload', function(err, res, body){
      expect(body).toBeDefined();
      body = JSON.parse(body);
      expect(body.body).toBeDefined();
      expect(body.body.my_field).toBeDefined();
      expect(body.body.my_buffer).toBeDefined();
      expect(body.files.my_file).toBeDefined();
      httpServer.close();
      next();
    });
    var form = r.form()
    form.append('my_field', 'my_value')
    form.append('my_buffer', new Buffer([1, 2, 3]))
    form.append('my_file', fs.createReadStream(path.join(__dirname, '../data/file.txt')));
  });

});