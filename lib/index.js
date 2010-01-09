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
    var locationKey = this.prefix + ":" + location
    var users = this.redis.keys(locationKey + ":*").wait()
    return _.reduce(users, [], function(users, user) {
      if(user && user.length > 0)
        users.push(user.substr(locationKey.length+1, user.length))
      return users;
    })
  }
}