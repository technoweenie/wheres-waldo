var Query = require('querystring'),
     Http = require('http'),
      Url = require('url'),
      fab = require('fab')
      sys = require('sys')

// higher level method if you don't want to worry about setting up the waldo
// and redis objects.  args are passed right to redis.
exports.create = function(port, host) {
  redisClient = require('redisclient')
  redis       = new redisClient.Client(port, host)
  waldo       = require('./index').create(redis)
  return this.createServer(waldo)
}

exports.createServer = function(waldo, callback) {
  return new ApiServer(waldo, callback)
}

// wrapper around an HTTP Server that has its own events:
// * request(req)
// * locate(user, location)
// * list(location, users)
// * track()
//
// Pass a callback to modify the prefix or the fab directly.
//
//   var server = new ApiServer(waldo, function(srv) {
//     srv.prefix = '/foo'
//     // don't finish the fab
//     srv.fab = ( fab )
//       ('/foo', 'foo!')
//   })
function ApiServer(waldo, callback) {
  this.waldo  = waldo
  this.prefix = '/waldo'
  this.fab    = null
  if(callback)
    callback(this)
  if(this.fab)
    this.fab = this.mountToFab(this.prefix, this.fab)
}

ApiServer.prototype.listen = function(port, callback) {
  this.server = Http.createServer((this.fab || this.createFab())(fab))
  if(callback) {
    callback(this.server)
  }
  this.server.listen(port)
}

ApiServer.headers = {'Content-Type': 'application/json'}
ApiServer.prototype.createFab  = function(prefix) {
  return this.mountToFab(prefix || this.prefix, fab)
}

ApiServer.prototype.mountToFab = function(prefix, fab) {
  var app = this
  return ( fab )
    (prefix)
      ('/track_and_list', function(respond) {
        var fab = this
        if(!fab.url.query) fab.url.query = {}
        if(fab.url.query.name && fab.url.query.location) {
          app.waldo.track(fab.url.query.name, fab.url.query.location).addCallback(function() {
            app.waldo.list(fab.url.query.location).addCallback(function(users) {
              respond(app.buildJSON(users, fab))
              respond(null)
            })
          })
        } else {
          return app.buildJSON("", fab)
        }
      })
      ('/locate', function(respond) {
        var fab = this
        if(!fab.url.query) fab.url.query = {}
        if(fab.url.query.name) {
          app.waldo.locate(fab.url.query.name).addCallback(function(location) {
            respond(app.buildJSON(location, fab))
            respond(null)
          })
        } else {
          return app.buildJSON(null, fab)
        }
      })
      ('/list', function(respond) {
        var fab = this
        if(!fab.url.query) fab.url.query = {}
        if(fab.url.query.location) {
          app.waldo.list(fab.url.query.location).addCallback(function(users) {
            respond(app.buildJSON(users, fab))
            respond(null)
          })
        } else {
          return app.buildJSON(null, fab)
        }
      })
      ('/track', function(respond) {
        var fab = this
        if(!fab.url.query) fab.url.query = {}
        if(fab.url.query.name && fab.url.query.location) {
          app.waldo.track(fab.url.query.name, fab.url.query.location).addCallback(function() {
            respond(app.buildJSON(true, fab))
            respond(null)
          })
        } else {
          return app.buildJSON(false, fab)
        }
      })

      .GET(function() {
        return [404, ApiServer.headers, "Not found."]
      })
      [404]("Not found.")
    ();
}

ApiServer.prototype.addListener = function(event, listener) {
  return this.waldo.addListener(event, listener)
}

ApiServer.prototype.removeListener = function(event, listener) {
  return this.waldo.removeListener(event, listener)
}

ApiServer.prototype.listeners = function(event) {
  return this.waldo.listeners(event)
}

ApiServer.prototype.close = function() {
  if(this.server)
    return this.server.close()
}

ApiServer.prototype.buildJSON = function(body, fab) {
  body = JSON.stringify(body == null ? '' : body)
  if(fab.url.query.callback)
    body = fab.url.query.callback + "(" + body + ")"
  return body
}