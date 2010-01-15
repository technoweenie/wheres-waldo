var sys = require('sys'),
   http = require('http');

exports.create = function(options) {
  var api = new Api(options.waldo);
  return api.createServer();
}

function Api(waldo) {
  this.waldo = waldo;

  this.createServer = function() {
    return http.createServer(function (req, res) {
      res.sendHeader(200, {'Content-Type': 'application/json'});
      res.sendBody('""');
      res.finish();
    });
  }
}