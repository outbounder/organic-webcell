var util = require("util");
var Organel = require("organic").Organel;
var glob = require('glob');
var path = require("path");
var _ = require("underscore");
var fs = require("fs");
var first = require('first');

var Actions = require("../lib/Actions");
var Context = require("../lib/Context");
var DirectoryTree = require("../lib/DirectoryTree");

/* organel | 

Organelle responsible for mounting route handlers to ExpressHttpServer instance passed via HttpServer chemical. 

It also mounts any client-side javascript or less entry points and all their dependencies via require/import calls as bundles.

More details can be found at (ExpressHttpPages wisdom page)[http://wisdom.camplight.net/wisdom/511126818db3ebbc0d000006/Organic---ExpressHttpPages]


* `mount`: String

  *optional* value to be used for prefixing all routes. Useful for mounting all actions found to specific root url

* `cwd`: Object

  * optional * , Object containing key:value pairs, where all values will be prefixed with `process.cwd()` and set with their coressponding keys directly to the DNA of the organelle.

* `pages`: String

  provided full path to directory containing `pages` defined within javascript files with source code definition similar to ExpressHttpActions.

  Furthermore any files matching defined patterns will be mounted as client-side code or style.

* `pageHelpers`: String

  provided full path to directory containing `pageHelpers` defined within commonjs modules. Any exports from them will be attached to context of the `pages` within object with the same name as the corresponding page helper.

* `page` : Object
  * extname : ".jade"

* `pageStyle` : Object
  * extname : ".less"
  * urlName : "/style.css"

* `pageCode` : Object
  * extname : ".jade.js"
  * urlName : "/code.js"

* `prebuildAssets` : false

  Instructs the organelle to prebuild any found assets (client-side code or style) by emitting the corresponding chemicals and capturing their output either to memory or to given `assetsBuildDir`. 

  In case there is existing file corresponding to the asset been build, no compilation/prebuild occurs.

* `assetsBuildDir` : String

  If provided prebuild assets will be stored at given directory by its full path. 

  In addition providing value to this option instructs the organelle to try fetching the asset's contents from that directory. If the file is missing, the asset will be prebuild and then served. Having `prebuildAssets` option enabled, will instruct any compilation to be written at the given file location.

* `log`: false

  flag for instructing logging to stdout any found pages and client-side bundles (js/css).

* `debug` : false

  Providing `true` to this option will disable browser caching. This is useful during development.*/

/* incoming | HttpServer

* data - ExpressHttpServer instance

*/


/* outgoing | BundleCode

Chemical is emitted from the organelle upon need to bundle specific client-side javascript (`.jade.js` or what is configured is used as entry point).

* code : full path*/

/* outgoing | BundleStyle

Chemical is emitted from the organelle upon need to bundle specific client-side javascript (`.less` or what is configured is used as entry point).

* style : full path*/

/* outgoing | RenderPage

Chemical is emitted from the organelle upon need to render specific template.

Usually that is either static `.jade` file without page handler or page handler issuing `res.sendPage` or `res.renderPage` 

Checkout [this](http://wisdom.camplight.net/wisdom/511126818db3ebbc0d000006/Organic---ExpressHttpPages) for more details

* page : full path
* ... : data*/

module.exports = function ExpressHttpPages(plasma, config){
  Organel.call(this, plasma);

  var context = {
    plasma: this.plasma
  };
  var self = this;

  if(config.cwd)
    for(var key in config.cwd)
      config[key] = process.cwd()+config.cwd[key];

  this.config = config;

  this.config.action = this.config.action || {};
  this.config.action.extname = this.config.action.extname || ".js"

  this.config.page = this.config.page || {}
  this.config.page.extname = this.config.page.extname || ".jade";

  this.config.pageStyle = this.config.pageStyle || {};
  this.config.pageStyle.extname = this.config.pageStyle.extname || ".less";
  this.config.pageStyle.urlName = this.config.pageStyle.urlName || "/style.css";
  
  this.config.pageCode = this.config.pageCode || {};
  this.config.pageCode.extname = this.config.pageCode.extname || ".jade.js";
  this.config.pageCode.urlName = this.config.pageCode.urlName || "/code.js";

  this.started = new Date((new Date()).toUTCString());
  this.prebuildAssetsDestMap = {};
  this.prebuildAssetsCounter = 0;

  // bootstrap all actions once httpserver is ready
  this.on("HttpServer", function(chemical){
    var app = chemical.data.app;
    if(config.pageHelpers) {
      Context.scan({
        root: config.pageHelpers,
        extname: ".js"
      }, context, function(err){
        self.mountPageActions(app, config, context, function(){
          self.emit("ExpressHttpPages", self);
        });
      })
    } else 
      self.mountPageActions(app, config, context, function(){
        self.emit("ExpressHttpPages", self);
      });
    return false;
  });
}

util.inherits(module.exports, Organel);

module.exports.prototype.mountPageActions = function(app, config, context, callback){
  var actionsRoot = config.pages;
  var self = this;

  first(function(){
    self.actions = new DirectoryTree();
    self.actions.scan({
      targetsRoot: actionsRoot,
      targetExtname: config.action.extname,
      mount: config.mount,
      indexName: "index"+config.action.extname,
      excludePattern: config.pageCode.extname
    }, function(file, url, next){
      Actions.map(require(file).call(context, config), url, function(method, url, handler){
        var templatePath = file.replace(config.action.extname, config.page.extname);
        self.mountPageAction(app, method, url, handler, templatePath);
      });
      next();
    }, this);
  })
  .whilst(function(){
    self.pagesWithoutActions = new DirectoryTree();
    self.pagesWithoutActions.scan({
      targetsRoot: actionsRoot,
      targetExtname: config.page.extname,
      mount: config.mount,
      indexName: "index"+config.page.extname
    }, function(file, url, next){
      var actionPath = file.replace(config.page.extname, config.action.extname);
      fs.exists(actionPath, function(exists){
        if(!exists) { 
          // action handler was not found, so mount a page with standard action
          self.mountPageAction(app, "GET", url, function(req, res){
            res.sendPage(); 
          }, file);
        }
        next();
      })
    }, this);
  })
  .whilst(function(){
    self.styles = new DirectoryTree();
    self.styles.scan({
      targetsRoot: actionsRoot,
      targetExtname: config.pageStyle.extname,
      mount: config.mount,
      indexName: "index"+config.page.extname+config.pageStyle.extname
    }, function(file, url, next){
      self.mountPageStyle(app, url, file);
      next();
    }, this);
  })
  .whilst(function(){
    self.codes = new DirectoryTree();
    self.codes.scan({
      targetsRoot: actionsRoot,
      targetExtname: config.pageCode.extname,
      mount: config.mount,
      indexName: "index"+config.pageCode.extname
    }, function(file, url, next){
      self.mountPageCode(app, url, file);
      next();
    }, this);
  })
  .then(function(){
    if(callback) callback();
  })
}

module.exports.prototype.trackPrebuildAsset = function(url, destination){
  this.prebuildAssetsCounter += 1;
  this.prebuildAssetsDestMap[url] = destination;
}

module.exports.prototype.prebuildAssetDone = function(url){
  this.prebuildAssetsCounter -= 1; 
  if(this.prebuildAssetsCounter == 0)
    this.emit({type: "ExpressHttpPagesAssetsPacks", data: this.prebuildAssetsDestMap});
}

module.exports.prototype.mountPageStyle = function(app, url, file) {
  var self = this;

  if(url == "")
    url = this.config.pageStyle.urlName;
  else
    url += this.config.pageStyle.urlName;

  if(this.config.log)
    console.log("pagestyle GET", url);

  if(this.config.prebuildAssets) {
    var dest = self.config.assetsBuildDir?path.join(self.config.assetsBuildDir,url.split("/").join("-")):"memory";
    if(dest != "memory" && fs.existsSync(dest)) {
      if(self.config.log)
        console.log("pagecode prebuild already done", url);
      self.prebuildAssetsDestMap[url] = dest;
    } else {
      self.trackPrebuildAsset(url, dest);
      self.emit({
        type:"BundleStyle",
        style: file
      }, function(c){
        if(self.config.assetsBuildDir) {
          fs.writeFileSync(dest, c.data);
        }
        if(self.config.log)
          console.log("pagestyle prebuild done", url);
        setTimeout(function(){
          self.prebuildAssetDone(url);  
        }, 10);
      })
    }
  }

  app.get(url, function(req, res){
    if(self.prebuildAssetsDestMap[url] && self.prebuildAssetsDestMap[url] != "memory" && !self.config.debug) {
      if(self.sendCachedWhenUptodate(req, res))
        return;
      fs.readFile(self.prebuildAssetsDestMap[url], function(err, data){
        self.sendAssetWithCacheData(req, res, data.toString(), "text/css");
      })
    } else
      self.emitAndSend({
        type: "BundleStyle",
        style: file, 
        data: _.extend({}, req),
      }, req, res, "text/css");
  })
}

module.exports.prototype.mountPageCode = function(app, url, file) {
  var self = this;
  if(url == "")
    url = this.config.pageCode.urlName;
  else
    url += this.config.pageCode.urlName;

  if(this.config.log)
    console.log("pagecode GET", url);
  if(this.config.prebuildAssets) {
    var dest = self.config.assetsBuildDir?path.join(self.config.assetsBuildDir,url.split("/").join("-")):"memory";
    if(dest != "memory" && fs.existsSync(dest)) {
      if(self.config.log)
        console.log("pagecode prebuild already done", url);
      self.prebuildAssetsDestMap[url] = dest;
    } else {
      self.trackPrebuildAsset(url, dest);
      self.emit({
        type:"BundleCode",
        code: file
      }, function(c){
        if(self.config.assetsBuildDir) {
          fs.writeFileSync(dest, c.data);
        }
        if(self.config.log)
          console.log("pagecode prebuild done", url);
        setTimeout(function(){
          self.prebuildAssetDone(url);  
        }, 10);
      })
    }
  }

  app.get(url, function(req, res){
    if(self.prebuildAssetsDestMap[url] && self.prebuildAssetsDestMap[url] != "memory" && !self.config.debug) {
      if(self.sendCachedWhenUptodate(req, res))
        return;
      fs.readFile(self.prebuildAssetsDestMap[url], function(err, data){
        self.sendAssetWithCacheData(req, res, data.toString(), "text/javascript");
      })
    } else
      self.emitAndSend({
        type: "BundleCode",
        code: file, 
        data: _.extend({}, req)
      }, req, res, "text/javascript");
  });
}

module.exports.prototype.sendCachedWhenUptodate = function(req, res){
  if(!this.config.debug) {
    var modified = true;
    try {
      var mtime = new Date(req.headers['if-modified-since']);
      if (mtime.getTime() >= this.started.getTime()) {
        modified = false;
      }
    } catch (e) {
      console.warn(e);
    }
    if (!modified) {
      res.writeHead(304);
      res.end();
      return true;
    }
  }
}

module.exports.prototype.sendAssetWithCacheData = function(req, res, data, contentType){
  if(!this.config.debug) {
    res.setHeader('last-modified', this.started.toUTCString());
    res.setHeader("content-type", contentType);
    res.send(data);
  } else {
    res.setHeader("content-type", contentType);
    res.send(data);
  }
}

module.exports.prototype.emitAndSend = function(chemical, req, res, contentType) {
  var self = this;
  if(self.sendCachedWhenUptodate(req, res))
    return;
  self.emit(chemical, function(c){
    if(c instanceof Error) {
      res.setHeader("content-type", "text/html");
      res.setHeader("content-length", c.toString().length);
      return res.send(c.toString(), 500);
    }
    self.sendAssetWithCacheData(req, res, c.data, contentType);
  });
}

module.exports.prototype.applyHelpers = function(template, req, res) {
  var self = this;

  // providing config to the req object 
  // so that all actions can directly use it
  _.extend(req, self.config);

  res.renderPage = function(data, path, callback) {
    if(typeof data == "string") {
      path = data;
      data = {};
    }
    if(typeof path == "function") {
      callback = path;
      path = undefined;
    }

    if(path && path.indexOf("/") != 0 && path.indexOf(":\\") != 1)
      path = process.cwd()+"/"+path;

    self.emit(_.extend(req, {
      type: "RenderPage",
      page: path || template
    }, data), callback);
  }
  res.sendPage = function(data, path){
    res.renderPage(data, path, function(c){
      res.send(c.data);
    });
  }
}

module.exports.prototype.mountPageAction = function(app, method, url, action, template) {
  var self = this;

  if(url == "")
    url = "/";
  var args = [url];

  if(Array.isArray(action)) {
    _.each(action, function(a){
      args.push(function(req, res, next){
        self.applyHelpers(template, req, res);
        a(req, res, next);
      });
    });
  } else {
    args.push(function(req, res, next){
      self.applyHelpers(template, req, res);
      action(req, res, next);
    });
  }
  
  if(this.config.log)
    console.log("pageaction", method, url);

  if(method == "*")
    app.all.apply(app, args);
  else
  if(method == "DELETE")
    app.del.apply(app, args);
  else
    app[method.toLowerCase()].apply(app, args);
};