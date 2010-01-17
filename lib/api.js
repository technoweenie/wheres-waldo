var sys = require('sys'),
   Http = require('http'),
    Url = require('url'),
  Query = require('querystring')

// higher level method if you don't want to worry about setting up the waldo
// and redis objects.  args are passed right to redis.
exports.create = function(port, host) {
  redis = require('redisclient').Client(port, host)
  waldo = require('./index').create(redis)
  return this.createServer(waldo)
}

exports.createServer = function(waldo) {
  return Http.createServer(function(req, res) {
    new ApiRequest(waldo, req, res)
  })
}

function ApiRequest(waldo, req, res) {
  this.url    = Url.parse(req.url)
  this.waldo  = waldo
  this.req    = req
  this.res    = res
  this.params = this.url.query ? Query.parseQuery(this.url.query) : {}

  switch(this.url.pathname) {
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
    this.waldo.track(this.params.name, this.params.location).addCallback(function() {
      api.respond()
    })
  } else {
    api.respond()
  }
}

ApiRequest.headers = {'Content-Type': 'application/json'}
ApiRequest.prototype.respond = function(body) {
  this.res.sendHeader(200, ApiRequest.headers)
  this.res.sendBody(JSON.stringify(body || ''))
  this.res.finish()
}