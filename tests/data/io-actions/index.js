module.exports = function(config){
  return {
    "GET": this.sendTrue,
    "POST /:smth/here": this.sendSmth
  }
}