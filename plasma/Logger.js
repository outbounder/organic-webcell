var util = require("util");
var Organel = require("organic").Organel;

var winston = require("winston");
var winston_mongodb = require('winston-mongodb').MongoDB;
var winston_amon = require('winston-amon').Amon;

module.exports = function Logger(plasma, config){
  Organel.call(this, plasma);

  //Setting up winston logger
  var logger = new winston.Logger({
    transports: [ new (winston.transports.Console)()]
  });

  if(config.mongo && config.mongo.enabled) {
    logger.add(winston_mongodb, {
      handleExceptions: true,
      safe:true,
      timestamp: true,
      db: config.mongo.dbname,
      collection: config.mongo.collection
    });
  }

  if(config.amon && config.amon.enabled){
    logger.add(winston_amon, {
      level: config.amon.logLevel
    });
  }

  this.on("HttpServer", function(chemical){
    chemical.data.app.use(function(err, req, res, next){
      logger.error(err.message, {stack: err.stack});
    });
    return false; // pass forward...
  });

  if(config.listenUncaughtExceptions)
    process.addListener("uncaughtException", function(err) {
      logger.error(err.message, {stack:err.stack});
    });
}

util.inherits(module.exports, Organel);