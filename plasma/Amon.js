var amonModule = require("amon");

module.exports = function Amon(plasma, config){
  if(config.enabed) {
    console.log("using amon");
    this.amon = amonModule.Amon;
    this.amon.protocol = config.protocol;
    this.amon.host = config.host;
    this.amon.port = config.port;
    this.amon.app_key = config.app_key;
    process.addListener("uncaughtException", function(err) {
      console.log(err);
      this.amon.handle(err);
    });
  }
}