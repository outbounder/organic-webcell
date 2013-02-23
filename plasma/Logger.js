var util = require("util");
var Organel = require("organic").Organel;

module.exports = function Logger(plasma, config){
  Organel.call(this, plasma);

  //Setting up winston logger
  if(config.useWinston) {
    var winston = require("winston");
    var logger = new winston.Logger({
      transports: [ new (winston.transports.Console)()]
    });

    if(config.mongo && config.mongo.enabled) {
      var winston_mongodb = require('winston-mongodb').MongoDB;
      logger.add(winston_mongodb, {
        handleExceptions: true,
        safe:true,
        timestamp: true,
        db: config.mongo.dbname,
        collection: config.mongo.collection
      });
    }

    if(config.amon && config.amon.enabled){
      var winston_amon = require('winston-amon').Amon;
      logger.add(winston_amon, {
        level: config.amon.logLevel
      });
    }

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
    })
  } else 
    this.on("Logger", function(c, sender, callback){
      console.log(c);
      if(callback) callback(c);
    });

  if(config.listenUncaughtExceptions)
    process.addListener("uncaughtException", function(err) {
      logger.error(err.message, {stack:err.stack});
    });

  if(config.useClim)
    require("clim")(console, true);
}

util.inherits(module.exports, Organel);