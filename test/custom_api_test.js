var redisclient = require('redisclient'),
    whereswaldo = require('../lib'),
         assert = require('assert'),
       testHttp = require('./helpers/test_client'),
       promises = require('./lib/promise-group')
      listeners = require('./helpers/temp_listeners')
            sys = require('sys'),
            api = require('../lib/api');

process.mixin(GLOBAL, require('ntest'));

var    PORT = 8889,
      redis = new redisclient.Client(),
      waldo = whereswaldo.create(redis),
     client = testHttp.createClient(PORT),
waldoServer = api.createServer(waldo, function(srv) {
  srv.prefix = '/custom-waldo'
  srv.fab = ( fab )
    ('/hello', 'hello world')
});
waldoServer.listen(PORT, function(srv) {
  srv.addListener('close', function(e) {
    process.exit();
  })
});

before(function() { redis.flushdb().wait() })

it("hits custom fab action", function() {
  var resp = client.request("/hello").wait()
  assert.equal("hello world", resp.body)
})

it("tracks user's location", function() {
  client.request("/custom-waldo/track?name=bob&location=gym").wait()
  var resp = client.request("/custom-waldo/locate?name=bob").wait();
  assert.equal('"gym"', resp.body);

  var resp = client.request("/custom-waldo/list?location=gym").wait();
  assert.equal('["bob"]', resp.body);
})

it("tracks a user and lists users for that location", function() {
  client.request("/custom-waldo/track?name=thing1&location=hat").wait()
  var resp = client.request("/custom-waldo/track_and_list?name=thing2&location=hat").wait()
  assert.equal('["thing1","thing2"]', resp.body)
})

waldoServer.close();