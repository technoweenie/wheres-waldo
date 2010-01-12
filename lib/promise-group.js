// Returns a single promise that emits success or error when the given promises
// are complete.
//
// Probably a moot point since Promise.group is coming?
// http://bit.ly/5gtcIW (google groups)
//
//   var promises = require('promise-group')
//   promises.group(promise1, promise2).addCallback(...)
//
exports.group = function() {
  return new PromiseGroup(Array.prototype.slice.call(arguments)).promise;
}

function PromiseGroup(promises) {
  var promise = new process.Promise(),
   promiseLen = promises.length,
    responses = {}; // holds values and their position, 
                    // we don't know what order they will finish

  promises.forEach(function(p, position) {
    p.addCallback(function(value) {
      promises.shift();
      responses[position] = value;
      if(promises.length == 0) {
        var sortedResponses = [];
        for(var i = 0; i < promiseLen; ++i) {
          sortedResponses.push(responses[i])
        }
        promise.emitSuccess(sortedResponses);
      }
    })
    .addErrback(function() {
      promise.emitError();
    })
  })
  this.promise = promise;
}