module.exports = function(client) {
  client.bundle.transform(function(file){
    if (!/\.template$/.test(file)) return client.through();

    var buffer = "";

    return client.through(function(chunk) {
      buffer += chunk.toString();
    },
    function() {
      // Compile only with the runtime dependency.
      var compiled = "module.exports = " + JSON.stringify(buffer) + "\n";
      this.queue(compiled);
      this.queue(null);
    });
  });
}