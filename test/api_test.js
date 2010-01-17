var redisclient = require('redisclient'),
    whereswaldo = require('../lib'),
         assert = require('assert'),
       testHttp = require('./helpers/test_client'),
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
  var resp = client.request("/locate?name=bob").wait();
  assert.equal('""', resp.body);
})

it("lists empty location", function() {
  var resp = client.request("/list?location=gym").wait();
  assert.equal('[]', resp.body);
})

it("tracks user's location", function() {
  client.request("/track?name=bob&location=gym").wait()
  var resp = client.request("/locate?name=bob").wait();
  assert.equal('"gym"', resp.body);

  var resp = client.request("/list?location=gym").wait();
  assert.equal('["bob"]', resp.body);
})

it('handles bad 404 requests', function() {
  var resp = client.request("/").wait()
  assert.equal(404, resp.statusCode)
})

it('ignores invalid locate request', function() {
  var resp = client.request("/locate").wait();
  assert.equal('""', resp.body);
})

it('ignores invalid list request', function() {
  var resp = client.request("/list").wait();
  assert.equal('""', resp.body);
})

it('ignores invalid track request', function() {
  var resp = client.request("/track").wait();
  assert.equal('""', resp.body);
})

it('emits request event', function() {
  promise = listeners.wrap(waldoServer, 'request', function(r) {
    assert.equal('/foo', r.url)
    promise.emitSuccess()
  })
  client.request("/foo")
  promise.wait()
})

it('emits track event', function() {
  promise = listeners.wrap(waldoServer, 'track', function(user, location) {
    assert.equal('mark', user)
    assert.equal('work', location)
    promise.emitSuccess()
  })
  client.request("/track?name=mark&location=work")
  promise.wait()
})

it('emits locate event', function() {
  client.request("/track?name=mark&location=work")
  promise = listeners.wrap(waldoServer, 'locate', function(user, location) {
    assert.equal('mark', user)
    assert.equal('work', location)
    promise.emitSuccess()
  })
  client.request("/locate?name=mark")
  promise.wait()
})

it('emits list event', function() {
  client.request("/track?name=mark&location=work")
  promise = listeners.wrap(waldoServer, 'list', function(location, users) {
    assert.equal('mark', users[0])
    assert.equal('work', location)
    promise.emitSuccess()
  })
  client.request("/list?location=work")
  promise.wait()
})

waldoServer.close();