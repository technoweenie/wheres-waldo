var sys = require('sys')
require('underscore')

exports.create = function(redis, prefix) {
  return new WheresWaldo(redis, prefix);
}

function WheresWaldo(redis, prefix) {
  this.prefix = prefix || 'waldo';
  this.redis  = redis;

  this.track = function(user, location, ttl) {
    this.redis.set(this.prefix + ":" + user, location).wait()
    this.redis.set(this.prefix + ":" + location + ":" + user, user).wait()
  }

  this.locate = function(user) {
    return this.redis.get(prefix + ":" + user).wait()
  }

  this.list = function(location) {
    var locationKey = this.prefix + ":" + location;
    var promise     = new process.Promise();
    this.redis.keys(locationKey + ":*") 
      .addCallback(function(keys) {
        var users = _.reduce(keys, [], function(users, key) {
          if(key && key.length > 0)
            users.push(key.substr(locationKey.length+1, key.length))
          return users;
        })
        promise.emitSuccess(users);
      })
      .addErrback(function() {
        promise.emitError();
      })
    return promise;
  }
}