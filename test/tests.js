var assert = require("chai").assert;

var stream = require("readable-stream");

var CombineStream = require("../");

describe("combine-stream", function() {
  it("should combine all output into one stream", function(done) {
    var combine = new CombineStream();

    var expected = ["hello 1", "hello 2"];
        actual = [];

    combine.on("data", function(e) {
      actual.push(e);
    });

    combine.on("end", function() {
      assert.deepEqual(expected, actual);

      return done();
    });

    var s1 = new stream.Transform({objectMode: true}),
        s2 = new stream.Transform({objectMode: true});

    s1._transform = function _transform(input, encoding, done) {
      this.push(input + " 1");

      return done();
    };

    s2._transform = function _transform(input, encoding, done) {
      this.push(input + " 2");

      return done();
    };

    combine.addStream(s1);
    combine.addStream(s2);

    combine.write("hello");

    combine.end();
  });
});
