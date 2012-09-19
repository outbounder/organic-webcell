var Chemical = function(data){
  for(var key in data)
    this[key] = data[key];
}
Chemical.prototype.toJSON = function(){
  return {
    method: this.method,
    model: this.model.toJSON(),
    options: this.options,
  }
}

module.exports = Chemical;