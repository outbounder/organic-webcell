var express = require("express");
var MongoStore = require('connect-mongo')(express);

module.exports = function(config, httpServer) {
  if(!config.cookie_secret || !config.dbname)
    throw new Error("cookie_secret or dbname in config are missing");
  
  return express.session({
    secret: config.cookie_secret,
    store: new MongoStore({
      db: config.dbname
    })
  });
}