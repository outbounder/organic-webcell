var express = require('express');

module.exports = function(config, httpServer){
  httpServer.app.use(express.cookieParser());
}