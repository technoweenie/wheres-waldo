var http = require('http'),
     sys = require('sys');

exports.createClient = function(port) {
  return new TestClient(port);
}

function TestResponse(statusCode, headers, body) {
  this.statusCode = statusCode;
  this.headers    = headers;
  this.body       = body || "";
}

function TestClient(port) {
  this.client = http.createClient(port);

  this.addListener = function(event, callback) {
    this.client.addListener(event, callback);
  }

  this.request = function(path) {
    var promise = new process.Promise(),
       testResp = new TestResponse();
    this.client.request(path).finish(function(resp) {
      resp.setBodyEncoding("utf8");
      testResp.statusCode = resp.statusCode;
      resp.addListener("body", function (chunk) { testResp.body += chunk });
      resp.addListener("complete", function () { 
        promise.emitSuccess(testResp);
      });
    })
    return promise;
  }
}