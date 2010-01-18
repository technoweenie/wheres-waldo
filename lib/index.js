var  sys = require('sys'),
promises = require('./promise-group');
require('underscore');

exports.create = function(redis, prefix) {
  return new WheresWaldo(redis, prefix);
}

// Tracks temporary locations of users with a 5 minute TTL.  Emits these events:
// * request(req)
// * locate(user, location)
// * list(location, users)
// * track()
//
var WheresWaldo = exports.WheresWaldo = function(redis, prefix) {
  this.prefix = prefix || 'waldo';
  this.redis  = redis;
  this.age    = 300 // 5 minutes
}
sys.inherits(WheresWaldo, process.EventEmitter)

WheresWaldo.prototype.track = function(user, location) {
  this.emit('track', user, location)
  var waldo = this
  return this.cleanupOldUserLocation(user, location).addCallback(function() {
    waldo.setUserLocation(user, location)
    waldo.addLocationUser(user, location)
  })
}

WheresWaldo.prototype.locate = function(user) {
  var waldo = this
  return this.redis.get(this.key(user)).addCallback(function(location) {
    waldo.emit('locate', user, location)
  })
}

WheresWaldo.prototype.list = function(location) {
  var locationKey = this.key(location),
          promise = new process.Promise(),
            waldo = this
  this.redis.keys(locationKey + ":*") 
    .addCallback(function(keys) {
      var users = _.reduce(keys, [], function(users, key) {
        if(key && key.length > 0)
          users.push(key.substr(locationKey.length+1, key.length))
        return users;
      }).sort()
      waldo.emit('list', location, users)
      promise.emitSuccess(users);
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

WheresWaldo.prototype.cleanupOldUserLocation = function(user, location) {
  var waldo = this,
        key = this.key(user)
  return this.redis.get(key).addCallback(function(oldLocation) {
    if(oldLocation && oldLocation != location)
      waldo.redis.del(waldo.key(oldLocation, user))
  })
}

WheresWaldo.prototype.setUserLocation = function(user, location) {
  var key = this.key(user),
    waldo = this
  return this.redis.set(key, location).addCallback(function() {
    waldo.redis.expire(key, waldo.age)
  })
}

WheresWaldo.prototype.addLocationUser = function(user, location) {
  var key = this.key(location, user),
    waldo = this
  return this.redis.set(key, 1).addCallback(function() {
    waldo.redis.expire(key, waldo.age)
  })
}