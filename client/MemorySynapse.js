var MemorySynapse = function(ModelClass, config){
  this.ModelClass = ModelClass;
  this.config = config;
}

MemorySynapse.prototype.init = function() {
  this.ModelClass.on("broadcast", function(chemical, sender, callback){
    if(this.config.debug) console.log("inmemory sync = noop".red, chemical);
    callback(null, chemical.model.toJSON());
  }, this);
}

module.exports.attach = function(Backbone){
  Backbone.MemorySynapse = MemorySynapse;
}