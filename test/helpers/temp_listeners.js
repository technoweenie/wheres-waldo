exports.wrap = function(emitter, event, listener) {
  promise  = new process.Promise()
  emitter.addListener(event, listener)
  promise.addCallback(function() {
    emitter.removeListener(event, listener)
  })
  return promise
}