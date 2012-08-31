module.exports = function(chemical, callback) {
  if(chemical.inputData.type == "test") {
    chemical.data = {"value": "13"}
  }
  callback();
}