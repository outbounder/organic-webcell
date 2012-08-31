module.exports = function(chemical, next) {
  chemical.callback(null, chemical.data+" world");
}