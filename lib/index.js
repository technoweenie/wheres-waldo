var  sys = require('sys'),
promises = require('./promise-group');
require('underscore');

exports.create = function(redis, prefix) {
  return new WheresWaldo(redis, prefix);
}

var WheresWaldo = exports.WheresWaldo = function(redis, prefix) {
  this.prefix = prefix || 'waldo';
  this.redis  = redis;
}

WheresWaldo.prototype.track = function(user, location, ttl) {
  var userKey = this.prefix + ":" + user,
       locKey = this.prefix + ":" + location + ":" + user,
        waldo = this
  var p1 = this.redis.get(userKey).addCallback(function(oldLocation) {
    if(oldLocation)
      waldo.redis.del(waldo.prefix + ":" + oldLocation + ":" + user)
  })
  return promises.group(p1,
    this.redis.set(userKey, location),
    this.redis.set(locKey,  user))
}

WheresWaldo.prototype.locate = function(user) {
  return this.redis.get(this.prefix + ":" + user)
}

WheresWaldo.prototype.list = function(location) {
  var locationKey = this.prefix + ":" + location,
          promise = new process.Promise();
  this.redis.keys(locationKey + ":*") 
    .addCallback(function(keys) {
      var users = _.reduce(keys, [], function(users, key) {
        if(key && key.length > 0)
          users.push(key.substr(locationKey.length+1, key.length))
        return users;
      }).sort()
      promise.emitSuccess(users);
    })
    .addErrback(function() {
      promise.emitError();
    })
  return promise;
}