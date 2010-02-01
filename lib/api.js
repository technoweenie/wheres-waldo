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

exports.createServer = function(waldo) {
  return new ApiServer(waldo)
}

// wrapper around an HTTP Server that has its own events:
// * request(req)
// * locate(user, location)
// * list(location, users)
// * track()
//
function ApiServer(waldo, prefix) {
  if(!prefix)
    prefix = '/waldo'
  this.waldo    = waldo

  app = ( fab )
  app = this.mountToFab(prefix, app)
  this.server = Http.createServer(app(fab));
}

ApiServer.headers = {'Content-Type': 'application/json'}
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

ApiServer.prototype.listen = function(port) {
  return this.server.listen(port)
}

ApiServer.prototype.close = function() {
  return this.server.close()
}

ApiServer.prototype.buildJSON = function(body, fab) {
  body = JSON.stringify(body == null ? '' : body)
  if(fab.url.query.callback)
    body = fab.url.query.callback + "(" + body + ")"
  return body
}