var stream = require("readable-stream");

var CombineStream = module.exports = function CombineStream(options) {
  options = options || {};

  if (Array.isArray(options)) {
    options = {streams: options};
  }

  options.objectMode = true;

  stream.Duplex.call(this, options);

  this._streams = [];

  if (options.streams && Array.isArray(options.streams)) {
    for (var i=0;i<options.streams.length;++i) {
      this.addStream(options.streams[i]);
    }
  }

  var self = this;

  // propagate .end() action
  this.on("finish", function() {
    var waiting = self._streams.length;

    var streams = self._streams.slice();

    return streams.forEach(function(entry) {
      entry.stream.removeListener("end", entry.onEnd);
      entry.stream.removeListener("finish", entry.onFinish);

      return entry.stream.end(function() {
        waiting--;

        if (waiting === 0) {
          return self.push(null);
        }
      })
    });
  });
};
CombineStream.prototype = Object.create(stream.Duplex.prototype, {constructor: {value: CombineStream}});

CombineStream.prototype._write = function _write(input, encoding, done) {
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

CombineStream.prototype._read = function _read(n) {
  for (var i=0;i<this._streams.length;++i) {
    this._streams[i].stream.resume();
  }
};

CombineStream.prototype.addStream = function addStream(str) {
  var self = this;

  var onData = function onData(e) {
    if (!self.push(e)) {
      str.pause();
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
