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
waldoServer = api.createServer(waldo);
waldoServer.listen(PORT);

waldoServer.server.addListener('close', function(e) {
  process.exit();
})

before(function() { redis.flushdb().wait() })

it("cannot locate missing user", function() {
  var resp = client.request("/waldo/locate?name=bob").wait();
  assert.equal('""', resp.body);
})

it("lists empty location", function() {
  var resp = client.request("/waldo/list?location=gym").wait();
  assert.equal('[]', resp.body);
})

it("tracks user's location", function() {
  client.request("/waldo/track?name=bob&location=gym").wait()
  var resp = client.request("/waldo/locate?name=bob").wait();
  assert.equal('"gym"', resp.body);

  var resp = client.request("/waldo/list?location=gym").wait();
  assert.equal('["bob"]', resp.body);
})

it("tracks a user and lists users for that location", function() {
  client.request("/waldo/track?name=thing1&location=hat").wait()
  var resp = client.request("/waldo/track_and_list?name=thing2&location=hat").wait()
  assert.equal('["thing1","thing2"]', resp.body)
})

it('handles bad 404 requests', function() {
  var resp = client.request("/waldo").wait()
  assert.equal(404, resp.statusCode)
})

it('ignores invalid locate request', function() {
  var resp = client.request("/waldo/locate").wait();
  assert.equal('""', resp.body);
})

it('ignores invalid list request', function() {
  var resp = client.request("/waldo/list").wait();
  assert.equal('""', resp.body);
})

it('ignores invalid track_and_list request', function() {
  var resp = client.request("/waldo/track_and_list").wait();
  assert.equal('""', resp.body);
})

it('ignores invalid track request', function() {
  promise = promises.group(
    client.request("/waldo/track"),
    client.request("/waldo/track?name=1"),
    client.request("/waldo/track?location=1"))
  var resps = promise.wait()
  resps.forEach(function(resp) {
    assert.equal('false', resp.body)
  })
})

it('wraps locate request in callback', function() {
  var resp = client.request("/waldo/locate?callback=foo").wait();
  assert.equal('foo("")', resp.body);
})

it('wraps list request in callback', function() {
  var resp = client.request("/waldo/list?callback=foo").wait();
  assert.equal('foo("")', resp.body);
})

it('wraps track_and_list request in callback', function() {
  var resp = client.request("/waldo/track_and_list?callback=foo").wait();
  assert.equal('foo("")', resp.body);
})

it('wraps track request in callback', function() {
  var resp = client.request("/waldo/track?callback=foo").wait();
  assert.equal('foo(false)', resp.body);
})

it('emits track event', function() {
  promise = listeners.wrap(waldoServer, 'track', function(user, location) {
    assert.equal('mark', user)
    assert.equal('work', location)
    promise.emitSuccess()
  })
  client.request("/waldo/track?name=mark&location=work")
  promise.wait()
})

it('emits locate event', function() {
  client.request("/waldo/track?name=mark&location=work")
  promise = listeners.wrap(waldoServer, 'locate', function(user, location) {
    assert.equal('mark', user)
    assert.equal('work', location)
    promise.emitSuccess()
  })
  client.request("/waldo/locate?name=mark")
  promise.wait()
})

it('emits list event', function() {
  client.request("/waldo/track?name=mark&location=work")
  promise = listeners.wrap(waldoServer, 'list', function(location, users) {
    assert.equal('mark', users[0])
    assert.equal('work', location)
    promise.emitSuccess()
  })
  client.request("/waldo/list?location=work")
  promise.wait()
})

waldoServer.close();