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
  var url = Url.parse(req.url)
   params = Query.parseQuery(url.query)

  var locate = function() {
    waldo.locate(params.name).addCallback(function(location) {
      respond(location || '-')
    })
  }

  var list = function() {
    waldo.list(params.location).addCallback(function(users) {
      respond(JSON.stringify(users))
    })
  }

  var track = function() {
    waldo.track(params.name, params.location).addCallback(function() {
      respond(' ')
    })
  }

  var respond = function(body) {
    res.sendHeader(200, {'Content-Type': 'application/json'})
    res.sendBody(body)
    res.finish()
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