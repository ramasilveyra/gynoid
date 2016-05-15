var winston = require('winston');
var bunyan_logger = require('./logger');

var bunyanTransport = new winston.Transport({
  level: process.env['LOG_LEVEL']
});

bunyanTransport.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return setImmediate(callback, null, true);
  }

  bunyan_logger[level](meta || {}, msg);
  setImmediate(callback, null, true);
};

winston.add(bunyanTransport, null, true);
