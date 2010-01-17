var redisclient = require('redisclient'),
    whereswaldo = require('../lib'),
       promises = require('../lib/promise-group'),
         assert = require('assert'),
            sys = require('sys'),
          redis = new redisclient.Client();

process.mixin(GLOBAL, require('ntest'));
redis.flushdb().wait()

describe("new waldo instance")
  newWaldo = whereswaldo.create(redis);

  it("has a default prefix", function() {
    assert.equal('waldo', newWaldo.prefix)
  })

  it('sets redis instance', function() {
    assert.equal(redis, newWaldo.redis)
  })

  it('does not know where a user is', function() {
    assert.ok(!newWaldo.locate('fred').wait())
  })

  it('returns no users for an empty location', function() {
    var users = newWaldo.list('home').wait();
    assert.equal(0, users.length)
  })

describe("custom new waldo instance")
  it('has a custom prefix', function() {
    waldo = whereswaldo.create(redis, 'custom')
    assert.equal('custom', waldo.prefix)
  })

describe("tracking a user")
  trackingWaldo = whereswaldo.create(redis, 'tracking')
  trackingWaldo.track('fred', 'home').wait()
  trackingWaldo.track('bob',  'gym').wait()
  trackingWaldo.track('fred', 'gym').wait()

  it("tracks a user's location", function() {
    assert.equal('gym', trackingWaldo.locate('bob').wait())
  })

  it("updates a user's location", function() {
    assert.equal('gym', trackingWaldo.locate('fred').wait())
    assert.equal(0, trackingWaldo.list('home').wait().length)
  })

  it("lists the user in that location", function() {
    users = trackingWaldo.list('gym').wait()
    assert.equal('bob',  users[0])
    assert.equal('fred', users[1])
  })

  it("expires a user's location after a set time", function() {
    trackingWaldo.age = 1

    assert.equal(0, trackingWaldo.list('home').wait().length)
    trackingWaldo.track('todd', 'home').wait()
    assert.equal(1, trackingWaldo.list('home').wait().length)

    var p = new process.Promise()
    setTimeout(function() {
      assert.equal(0, trackingWaldo.list('home').wait().length)
      p.emitSuccess()
    }, 2000)
    p.wait()
  })

process.exit()
  