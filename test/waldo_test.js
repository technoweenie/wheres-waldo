var redisclient = require('redisclient'),
    whereswaldo = require('../lib'),
         assert = require('assert');

process.mixin(GLOBAL, require('ntest'))

describe("new waldo instance")
  before(function() {
    this.redis = new redisclient.Client()
    this.waldo = whereswaldo.create(this.redis);
  })

  it("has a default prefix", function() {
    assert.equal('waldo', this.waldo.prefix)
  })

  it('sets redis instance', function() {
    assert.equal(this.redis, this.waldo.redis)
  })

  it('does not know where a user is', function() {
    assert.ok(!this.waldo.locate('bob'))
  })

  it('returns no users for an empty location', function() {
    assert.equal([], this.waldo.list('home'))
  })