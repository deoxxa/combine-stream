combine-stream [![build status](https://travis-ci.org/deoxxa/combine-stream.png)](https://travis-ci.org/deoxxa/fork)
===============

Combine multiple duplex streams into just one.

Overview
--------

combine-stream lets you treat a few streams as just one, in a parallel fashion.
When you combine a bunch of streams, you write to it as if it was one, and read
from it as if it was one, but you are simultaneously writing to all the streams
and getting the output from all the streams.

Error events are also aggregated from all the streams and forwarded up through
the combining stream for you to listen to in one place.

Super Quickstart
----------------

Code:

```javascript
var stream = require("stream");

var CombineStream = require("./");

var combine = new CombineStream();

var streamA = new stream.PassThrough({objectMode: true}),
    streamB = new stream.PassThrough({objectMode: true}),
    streamC = new stream.PassThrough({objectMode: true});

combine.addStream(streamA);
combine.addStream(streamB);
combine.addStream(streamC);

combine.on("data", console.log);

combine.write("hello");

combine.end();
```

Output:

```
hello
hello
hello
```

Installation
------------

Available via [npm](http://npmjs.org/):

> $ npm install combine-stream

Or via git:

> $ git clone git://github.com/deoxxa/combine-stream.git node_modules/combine-stream

**NOTE:**

Currently this is relying on [my fork of readable-stream](https://github.com/deoxxa/readable-stream/tree/fix-issue-66).
Hopefully my patch gets merged and I can remove the hardcoded github dependency.

API
---

**constructor**

Creates a new combine-stream.

```javascript
new CombineStream(options);
```

```javascript
var fork = new CombineStream({
  logSize: 100,
  recordDuplicates: true,
  comparator: functon compare(a, b) {
    return a === b;
  },
});
```

Arguments

* _options_ - an object containing, as well as the regular `TransformStream`
  options, the following possible parameters:

_options_

* _streams_ - an array of streams to add at instantiation time.

**addStream**

```javascript
combine.addStream(stream);
```

```javascript
combine.addStream(new stream.PassThrough({
  objectMode: true,
}));
```

Arguments

* _stream_ - a stream to add to the combine-stream intance

**removeStream**

```javascript
combine.removeStream(stream);
```

```javascript
combine.removeStream(anExistingStream);
```

Arguments

* _stream_ - a stream to remove from the combine-stream instance

Example
-------

Also see [example.js](https://github.com/deoxxa/combine-stream/blob/master/example.js).

```javascript
var stream = require("stream");

var CombineStream = require("combine-stream");

var combine = new CombineStream();

var delayed = function delayed(n) {
  var s = new stream.Transform({objectMode: true});

  s._transform = function _transform(input, encoding, done) {
    var self = this;

    return setTimeout(function() {
      self.push(input + " " + n);

      return done();
    }, n);
  };

  s._flush = function _flush(done) {
    console.log("ending!", n);

    setTimeout(done, n);
  };

  return s;
};

var streamA = delayed(100),
    streamB = delayed(500);

combine.addStream(streamA);
combine.addStream(streamB);

combine.on("data", console.log);
combine.on("error", console.log);

combine.write("hello 1");
combine.write("hello 2");
combine.write("hello 3");

combine.end(function() {
  console.log("everything finished");
});
```

Output:

```
hello 1 100
hello 1 500
hello 2 100
hello 2 500
hello 3 100
hello 3 500
ending! 100
ending! 500
everything finished
```

License
-------

3-clause BSD. A copy is included with the source.

Contact
-------

* GitHub ([deoxxa](http://github.com/deoxxa))
* Twitter ([@deoxxa](http://twitter.com/deoxxa))
* Email ([deoxxa@fknsrs.biz](mailto:deoxxa@fknsrs.biz))
