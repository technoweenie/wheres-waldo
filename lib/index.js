var  sys = require('sys'),
promises = require('./promise-group');
require('underscore');

exports.create = function(redis, prefix) {
  return new WheresWaldo(redis, prefix);
}

var WheresWaldo = exports.WheresWaldo = function(redis, prefix) {
  this.prefix = prefix || 'waldo';
  this.redis  = redis;
  this.age    = 300 // 5 minutes
}

WheresWaldo.prototype.track = function(user, location, ttl) {
  return promises.group(
    this.cleanupOldUserLocation(user),
    this.setUserLocation(user, location),
    this.addLocationUser(user, location))
}

WheresWaldo.prototype.locate = function(user) {
  return this.redis.get(this.key(user))
}

WheresWaldo.prototype.list = function(location) {
  var locationKey = this.key(location),
          promise = new process.Promise();
  this.redis.keys(locationKey + ":*") 
    .addCallback(function(keys) {
      var users = _.reduce(keys, [], function(users, key) {
        if(key && key.length > 0)
          users.push(key.substr(locationKey.length+1, key.length))
        return users;
      })
      promise.emitSuccess(users.sort());
    })
    .addErrback(function() {
      promise.emitError();
    })
  return promise;
}

WheresWaldo.prototype.key = function() {
  var args = Array.prototype.slice.call(arguments)
  Array.prototype.unshift.call(args, this.prefix)
  return args.join(":")
}

WheresWaldo.prototype.cleanupOldUserLocation = function(user) {
  var waldo = this,
        key = this.key(user)
  return this.redis.get(key).addCallback(function(oldLocation) {
    if(oldLocation)
      waldo.redis.del(waldo.key(oldLocation, user))
  })
}

WheresWaldo.prototype.setUserLocation = function(user, location) {
  var key = this.key(user)
  return promises.group(this.redis.set(key, location), this.redis.expire(key, this.age))
}

WheresWaldo.prototype.addLocationUser = function(user, location) {
  var key = this.key(location, user)
  return promises.group(this.redis.set(key, 1), this.redis.expire(key, this.age))
}