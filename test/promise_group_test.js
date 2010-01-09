var promises = require('../lib/promise-group'),
      assert = require('assert'),
         sys = require('sys');

process.mixin(GLOBAL, require('ntest'))

test("promise group returns values in correct order", function() {
  var promise1 = new process.Promise(),
      promise2 = new process.Promise(),
         group = promises.group(promise1, promise2)

  setTimeout(function() {
    promise1.emitSuccess(1);
  }, 200);
  setTimeout(function() {
    promise2.emitSuccess(2);
  }, 100);

  var values = group.wait();
  assert.equal(1, values[0]);
  assert.equal(2, values[1]);
})