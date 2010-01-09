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