var fs = require('fs');

var Configuration = function(path) {
  this.configPath = path;
  this.droids = {};
};

Configuration.prototype.read = function() {
  var content = fs.readFileSync(this.configPath);
  return JSON.parse(content);
};

Configuration.prototype.save = function(config) {
  try {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  } catch(err) {
    throw new Error({error: 'config_error', message: 'Unable to write configuration file.' + err.toString() });
  }
};

Configuration.prototype.saveDroid = function(name, droid) {
  var config = this.read();
  config.droids = config.droids || {};
  config.droids[name] = droid;
  this.droids[name] = name;
  this.save(config);
};

Configuration.prototype.removeDroid = function(name) {
  var config = this.read();
  if (config.droids) {
    delete config.droids[name];
  }

  delete this.droids[name];
  this.save(config);
};

Configuration.prototype.addExtension = function(name, extension) {
  var config = this.read();
  if (config.droids[name].extensions.indexOf(extension) === -1) {
    config.droids[name].extensions.push(extension);
    this.save(config);
  }
};

Configuration.prototype.removeExtension = function(name, extension) {
  var config = this.read();
  var index = config.droids[name].extensions.indexOf(extension);
  config.droids[name].extensions.splice(index, 1);
  this.save(config);
};

Configuration.prototype.addKey = function(droid, key, value) {
  var config = this.read();
  config.keys[droid] = config.keys[droid] || {};
  config.keys[droid][key] = value;
  this.save(config);
};

Configuration.prototype.removeKey = function(droid, key) {
  var config = this.read();
  delete config.keys[droid][key];
  this.save(config);
};

Configuration.prototype.listKeys = function(droid) {
  var config = this.read();
  return Object.keys(config.keys[droid]);
};

Configuration.prototype.listAllKeys = function() {
  var config = this.read();
  var keys = [];

  Object.keys(config.keys).map(function(key) {
    if (typeof config.keys[key] !== 'object') {
      keys.push(key);
    } else {
      Object.keys(config.keys[key]).forEach(function(k) {
        keys.push(k);
      });
    }
  });

  return keys;
};

module.exports = Configuration;
