var redisclient = require('redisclient'),
    whereswaldo = require('../lib'),
         assert = require('assert'),
       testHttp = require('./test_client'),
            sys = require('sys'),
            api = require('../lib/api');

process.mixin(GLOBAL, require('ntest'));

var    PORT = 8889,
      redis = new redisclient.Client(),
      waldo = whereswaldo.create(redis),
     client = testHttp.createClient(PORT),
waldoServer = api.create(waldo);
waldoServer.listen(PORT);

waldoServer.addListener('close', function(e) {
  process.exit();
})

before(function() { redis.flushdb().wait() })

it("cannot locate missing user", function() {
  var resp = client.request("/locate?name=bob").wait();
  assert.equal('-', resp.body);
})

it("lists empty location", function() {
  var resp = client.request("/list?location=gym").wait();
  assert.equal('[]', resp.body);
})

it("tracks user's location", function() {
  client.request("/track?name=bob&location=gym").wait()
  var resp = client.request("/locate?name=bob").wait();
  assert.equal('gym', resp.body);

  var resp = client.request("/list?location=gym").wait();
  assert.equal('["bob"]', resp.body);
})

waldoServer.close();