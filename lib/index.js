exports.create = function(redis, prefix) {
  return new WheresWaldo(redis, prefix);
}

function WheresWaldo(redis, prefix) {
  this.prefix = prefix || 'waldo';
  this.redis  = redis;

  this.track = function(user, location, ttl) {
    // waldo:user          = location
    // waldo:location:user = 1
  }

  this.locate = function(user) {
  }

  this.list = function(location) {
    return [];
  }
}