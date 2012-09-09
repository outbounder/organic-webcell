module.exports.attach = function(Backbone){

  var BackboneSync = Backbone.sync;
  Backbone.sync = function(method, model, options){
    if(method != "read:related" && method != "save:related") {
      BackboneSync.call(this, method, model, options);
      return;
    }

    switch(method) {
      case "save:related":
        var total = this.relations.length;
        var saveHandler = function(m){
          model.get("relations").push({model: m})
          total -= 1;
          if(total == 0)
            options.success();
        }
        _.each(this.relations, function(r){
          r.save({
            error: options.error,
            success: saveHandler
          });
        })
      break;
      case "fetch:related":
        var relations = this.get("relations");
        var total = relations.length;
        var fetchHandler = function(){
          total -= 1;
          if(total == 0)
            options.success();
        }
        _.each(relations, function(relationData, index){
          var instance = typeof relation == "string";
          instance.id = relationData.id;
          relations[i] = instance;
          relations[i].model = relationData.model;
          relations[i].fetch({
            error: options.error,
            success: fetchHandler
          })
        });
      break;
    }
  }
  Backbone.Model.prototype.fetchRelated = function(options){
    return Backbone.sync("fetch:related", this, options);
  }
  Backbone.Model.prototype.saveRelated = function(options){
    return Backbone.sync("save:related", this, options);
  }

  var modelSave = Backbone.Model.prototype.save;
  Backbone.Model.prototype.save = function(attr, options){
    options.success = function(){
      return model.saveRelated(options);
    };
    modelSave.call(this, attr, options);
  }

  var modelFetch = Backbone.Model.prototype.fetch;
  Backbone.Model.prototype.fetch = function(options) {
    options.success = function(){
      return model.fetchRelated(options);
    };
    modelFetch.call(this, options);
  }
}