var sys = require('sys'),
   Http = require('http'),
    Url = require('url'),
  Query = require('querystring')

exports.create = function(waldo) {
  return Http.createServer(function(req, res) {
    new ApiRequest(waldo, req, res)
  })
}

function ApiRequest(waldo, req, res) {
  this.url    = Url.parse(req.url)
  this.params = Query.parseQuery(this.url.query)
  this.waldo  = waldo
  this.req    = req
  this.res    = res

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
  this.waldo.locate(this.params.name).addCallback(function(location) {
    api.respond(location || '-')
  })
}

ApiRequest.prototype.list = function() {
  var api = this
  this.waldo.list(this.params.location).addCallback(function(users) {
    api.respond(JSON.stringify(users))
  })
}

ApiRequest.prototype.track = function() {
  var api = this
  this.waldo.track(this.params.name, this.params.location).addCallback(function() {
    api.respond(' ')
  })
}

ApiRequest.prototype.respond = function(body) {
  this.res.sendHeader(200, {'Content-Type': 'application/json'})
  this.res.sendBody(body)
  this.res.finish()
}