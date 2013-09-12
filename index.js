var stream = require("readable-stream");

var CombineStream = module.exports = function CombineStream(options) {
  options = options || {};

  if (Array.isArray(options)) {
    options = {streams: options};
  }

  options.objectMode = true;

  stream.Transform.call(this, options);

  this._streams = [];

  if (options.streams && Array.isArray(options.streams)) {
    for (var i=0;i<options.streams.length;++i) {
      this.addStream(options.streams[i]);
    }
  }
};
CombineStream.prototype = Object.create(stream.Transform.prototype, {constructor: {value: CombineStream}});

CombineStream.prototype._transform = function _transform(input, encoding, done) {
  var waiting = this._streams.length;

  if (waiting === 0) {
    return done();
  }

  for (var i=0;i<this._streams.length;++i) {
    this._streams[i].stream.write(input, encoding, function() {
      waiting--;

      if (waiting === 0) {
        return done();
      }
    });
  }
};

CombineStream.prototype._flush = function _flush(done) {
  var waiting = this._streams.length;

  if (waiting === 0) {
    return done();
  }

  var self = this;

  var streams = this._streams.slice();

  return streams.forEach(function(entry) {
    entry.stream.removeListener("end", entry.onEnd);
    entry.stream.removeListener("finish", entry.onFinish);

    return entry.stream.end(function() {
      self.removeStream(entry.stream);

      waiting--;

      if (waiting === 0) {
        return done();
      }
    })
  });
};

CombineStream.prototype.addStream = function addStream(str) {
  var self = this;

  var onData = function onData(e) {
    if (!self.push(e)) {
      str.pause();

      this.once("drain", function() {
        str.resume();
      });
    }
  };

  var onEnd = function onEnd() {
    self.removeStream(str);
  };

  var onFinish = function onFinish() {
    self.removeStream(str);
  };

  var onError = function onError(err) {
    self.emit("error", err);
  };

  str.on("data", onData);
  str.on("end", onEnd);
  str.on("finish", onFinish);
  str.on("error", onError);

  this._streams.push({
    stream: str,
    onData: onData,
    onEnd: onEnd,
    onFinish: onFinish,
    onError: onError,
  });

  return this;
};

CombineStream.prototype.removeStream = function removeStream(str) {
  var index = -1;

  for (var i=0;i<this._streams.length;++i) {
    if (this._streams[i].stream === str) {
      index = i;
      break;
    }
  }

  if (index === -1) {
    return this;
  }

  var entry = this._streams[index];
  this._streams.splice(index, 1);

  str.removeListener("data", entry.onData);
  str.removeListener("end", entry.onEnd);
  str.removeListener("finish", entry.onFinish);
  str.removeListener("error", entry.onError);

  return this;
};
