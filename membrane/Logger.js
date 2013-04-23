var util = require("util");
var Organel = require("organic").Organel;

/* 

organel | dna & defaults:

* prefixConsoleWithTimestamps - `false`

  instructs including modified version of [clim](http://github.com/epeli/node-clim.git) 
  which will monkey-patch `console` object so that any further usage will include 
  prefixed timestamp

* attachHttpServerErrorMiddleware - `false`

  instructs start listening for `HttpServer` Chemical containing `ExpressHttpServer data` 
  instance for attaching middleware responsible to piping any found errors to `console.error`
  method

* listenUncaughtExceptions - `false`

  instructs to do `process.addListener("uncaughtException", ...)` , which will then pipe any 
  errors to `console.error` method

*/

/* incoming | HttpServer

does not aggrigates the chemical

* data - ExpressHttpServer instance

*/

/* 

incoming | Logger 

does simple console.log( `chemical` )

*/

module.exports = function Logger(plasma, config){
  Organel.call(this, plasma);

  if(config.prefixConsoleWithTimestamps)
    require("../lib/clim")(console, true);

  var logger = console;
  this.config = config;

  if(config.attachHttpServerErrorMiddleware)
    this.on("HttpServer", function(chemical){
      if(chemical.data && chemical.data.app && chemical.data.app.use)
        chemical.data.app.use(function(err, req, res, next){
          logger.error(err.message, {stack: err.stack});
        });
      return false; // pass forward...
    });

  this.on("Logger", function(c, sender, callback){
    logger.log(c);
    if(callback) callback(c);
  });

  if(config.listenUncaughtExceptions)
    process.addListener("uncaughtException", function(err) {
      if(err.stack)
        logger.error(err.stack);
      else
        logger.error(err);
    });
}

util.inherits(module.exports, Organel);