var redisclient = require('redisclient'),
    whereswaldo = require('../lib'),
         assert = require('assert'),
           http = require('http'),
       testHttp = require('./test_client'),
            sys = require('sys'),
            api = require('../lib/api');

process.mixin(GLOBAL, require('ntest'));

var    PORT = 8889,
      redis = new redisclient.Client(),
      waldo = whereswaldo.create(redis),
     client = testHttp.createClient(PORT),
waldoServer = api.create({waldo: waldo});
waldoServer.listen(PORT);

waldoServer.addListener('close', function(e) {
  process.exit();
})

describe("an empty Waldo database")
  before(function() { redis.flushdb().wait() })

  it("cannot locate missing user", function() {
    var resp = client.request("/locate?name=bob").wait();
    assert.equal('""', resp.body);
    waldoServer.close();
  })