module.exports = function(through) {
  return function(file){
    if (!/\.template/.test(file)) return through();

    var buffer = "";

    return through(function(chunk) {
      buffer += chunk.toString();
    },
    function() {
      // Compile only with the runtime dependency.
      var compiled = "module.exports = '" + JSON.stringify(buffer.toString()) + "'\n";
      this.queue(compiled);
      this.queue(null);
    });
  }
}