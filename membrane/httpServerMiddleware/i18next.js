module.exports = function(app, config){

  // setup i18n support
  var i18next = require('i18next');

  i18next.init({
    fallbackLng: 'dev',
    saveMissing: true,
    resGetPath: process.cwd()+config.localesFolder+'/__lng__/__ns__.json',
    resSetPath: process.cwd()+config.localesFolder+'/__lng__/__ns__.json'
  });

  // checks current language settings: cookie, header, querystring ?setLng=bg
  app.use(function(req, res, next){
    req.locals = {
      t: i18next.t,
      translate: i18next.t,
      lng: i18next.lng,
      locale: i18next.lng,
      language: i18next.lng
    }
    i18next.handle(req, res, next);
  });

  i18next.serveDynamicResources(app)    // route which returns all resources in on response
         .serveMissingKeyRoute(app)     // route to send missing keys
         .serveChangeKeyRoute(app);     // route to post value changes
}