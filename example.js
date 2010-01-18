var sys = require('sys'),
    api = require('./lib/api').create(),
   PORT = 3456

api
  .addListener('request', function(req, status) {
    sys.puts(req.method + " " + req.url + ' => ' + status)
  })

  .addListener('locate', function(user, location) {
    sys.puts("LOCATE " + user + ' => ' + location)
  })

  .addListener('list', function(location, users) {
    sys.puts("LIST " + location + " => " + users.join(", "))
  })

  .addListener('track', function(user, location) {
    sys.puts("TRACK " + user + " => " + location)
  })

api.listen(PORT);

sys.puts("Starting Where's Waldo server on port " + PORT)