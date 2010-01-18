var Query = require('querystring'),
     Http = require('http'),
      Url = require('url'),
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
function ApiServer(waldo) {
  var apiServer = this
  this.waldo    = waldo
  this.server   = Http.createServer(function(req, res) {
    new ApiRequest(apiServer, req, res)
  })
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

function ApiRequest(server, req, res) {
  this.url    = Url.parse(req.url)
  this.server = server
  this.waldo  = server.waldo
  this.req    = req
  this.res    = res
  this.params = this.url.query ? Query.parseQuery(this.url.query) : {}

  switch(this.url.pathname) {
    case '/track_and_list':
      this.track_and_list()
      break

    case '/locate': 
      this.locate()
      break

    case '/list':
      this.list()
      break

    case '/track':
      this.track()
      break

    default:
      this.waldo.emit('request', req, 404)
      this.res.sendHeader(404)
      this.res.sendBody("Not found.")
      this.res.finish()
  }
}

ApiRequest.prototype.locate = function() {
  var api = this
  if(this.params.name) {
    this.waldo.locate(this.params.name).addCallback(function(location) {
      api.respond(location)
    })
  } else {
    api.respond()
  }
}

ApiRequest.prototype.track_and_list = function() {
  var api = this
  if(this.params.name && this.params.location) {
    this.waldo.track(this.params.name, this.params.location).addCallback(function() {
      api.waldo.list(api.params.location).addCallback(function(users) {
        api.respond(users)
      })
    })
  } else {
    api.respond()
  }
}

ApiRequest.prototype.list = function() {
  var api = this
  if(this.params.location) {
    this.waldo.list(this.params.location).addCallback(function(users) {
      api.respond(users)
    })
  } else {
    api.respond()
  }
}

ApiRequest.prototype.track = function() {
  var api = this
  if(this.params.name && this.params.location) {
    api.respond(true)
    this.waldo.track(this.params.name, this.params.location)
  } else {
    api.respond(false)
  }
}

ApiRequest.headers = {'Content-Type': 'application/json'}
ApiRequest.prototype.respond = function(body) {
  body = JSON.stringify(body == null ? '' : body)
  if(this.params.callback)
    body = this.params.callback + "(" + body + ")"

  this.waldo.emit('request', this.req, 200)
  this.res.sendHeader(200, ApiRequest.headers)
  this.res.sendBody(body)
  this.res.finish()
}