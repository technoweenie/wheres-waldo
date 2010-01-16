var sys = require('sys'),
   http = require('http')

exports.create = function(options) {
  return (new Api(options.waldo)).createServer();
}

function Api(waldo) {
  this.waldo = waldo
  this.url   = require('url')
  this.query = require('querystring')

  var api = this // use api.waldo in callback
  this.createServer = function() {
    return http.createServer(function(req, res) {
      new ApiRequest(api, req, res)
    })
  }
}

function ApiRequest(api, req, res) {
  var url = api.url.parse(req.url),
    query = api.query
   params = query.parseQuery(url.query)

  var locate = function() {
    api.waldo.locate(params.name).addCallback(function(location) {
      res.sendHeader(200, {'Content-Type': 'application/json'})
      res.sendBody(location || '-')
      res.finish()
    })
  }

  var list = function() {
    api.waldo.list(params.location).addCallback(function(users) {
      res.sendHeader(200, {'Content-Type': 'application/json'})
      res.sendBody(JSON.stringify(users))
      res.finish()
    })
  }

  var track = function() {
    api.waldo.track(params.name, params.location).addCallback(function() {
      res.sendHeader(200, {'Content-Type': 'application/json'})
      res.finish()
    })
  }

  switch(url.pathname) {
    case '/locate': 
      locate()
      break

    case '/list':
      list()
      break

    case '/track':
      track()
      break

    default:
      res.sendHeader(404)
      res.sendBody("Not found.")
      res.finish()
  }
}