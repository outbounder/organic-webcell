var express = require('express');

module.exports = function(config, httpServer){
  httpServer.app.use(express.methodOverride());
  httpServer.app.use(express.bodyParser());
  httpServer.app.use(express.cookieParser());
}