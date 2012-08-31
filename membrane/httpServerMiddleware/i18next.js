module.exports = function(config){

  // setup i18n support
  var i18next = this.i18next = require('i18next');

  i18next.init({
    fallbackLng: 'dev',
    saveMissing: true,
    resGetPath: process.cwd()+config.localesFolder+'/__lng__/__ns__.json',
    resSetPath: process.cwd()+config.localesFolder+'/__lng__/__ns__.json'
  });

  // adds helper t("scope.name") in templates
  i18next.registerAppHelper(this.app);

  // i18next.serveClientScript(app) is disabled as the js client code is copy-pasted to libs/external
  i18next.serveDynamicResources(this.app)    // route which returns all resources in on response
         .serveMissingKeyRoute(this.app)     // route to send missing keys
         .serveChangeKeyRoute(this.app);     // route to post value changes

  // checks current language settings: cookie, header, querystring ?setLng=bg
  return function(req, res, next){
    req.locals = {
      t: this.i18next.t,
      translate: this.i18next.t,
      lng: this.i18next.lng,
      locale: this.i18next.lng,
      language: this.i18next.lng
    }
    i18next.handle(req, res, next);
  }
}