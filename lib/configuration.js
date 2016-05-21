var fs = require('fs');

var Configuration = function(path) {
  this.configPath = path;
  this.droids = {};
};

Configuration.prototype.read = function() {
  return require(this.configPath);
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
  var index = config[name].extensions.indexOf(extension);
  config.droids[name].extensions.splice(index, 1);
  this.save(config);
};

module.exports = Configuration;
