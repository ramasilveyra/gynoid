var Promise = require('bluebird');
var async = require('async');

var Configuration = require('./configuration');
var env = require('./env');
var DroidExtend = require('./droid-extend');
var DroidInstaller = require('./droid-installer');

var Gynoid = function(Adapter) {
  this.droids = {};
  this.Adapter = Adapter;
  this.configuration = new Configuration(env.GYNOID_CONFIG_PATH);
  this.extensions = new DroidExtend(this);
  this.installer = new DroidInstaller();
};

Gynoid.prototype.loadDroids = function() {
  var gynoid = this;
  var config = gynoid.configuration.read();

  var droids = config.droids ? Object.keys(config.droids) : [];
  console.log('Droids in configuration:', droids.length);
  return Promise.resolve(droids).map(function(droidName) {
    return gynoid.loadDroid(droidName, config.droids[droidName]);
  });
};

Gynoid.prototype.loadDroid = function(name, droid) {
  var gynoid = this;
  var extensions = droid.extensions;

  console.log('Loading droid ' + name);
  return gynoid.registerDroid(name, droid.token)
    .then(function() {
      gynoid.droids[name].extensions = extensions;
      extensions.forEach(function(ext) { gynoid.configuration.addExtension(name, ext); });
      return Promise.resolve(droid.extensions).map(function(extension) {
        return gynoid.addExtension(name, extension)
          .catch(function() {
            // Something wrong occurred while loading extension. Remove it to avoid conflicts
            return gynoid.removeFromConfiguration(name, extension);
          });
        });
    }).catch(function(err) {
      console.error(err);
    });
};

Gynoid.prototype.reloadDroid = function(name) {
  var gynoid = this;
  var droid = gynoid.droids[name];

  var listeners = droid.listener.getAllListeners().map(function(l) { return l.id;});
  listeners.forEach(function(id) {
    droid.listener.removeListener(id);
  });

  return Promise.map(droid.extensions, function(extension) {
    return gynoid.addExtension(name, extension);
  });
};

Gynoid.prototype.registerDroid = function(name, token) {
  var gynoid = this;
  return new Promise(function (resolve, reject) {
    gynoid.configuration.saveDroid(name, { token: token, extensions: []});
    var droid = {
      name: name,
      listener: new gynoid.Adapter(token),
      extensions: [],
      extendable: true // All droids are extendable until a droid spec says otherwise
    };

    // By convention, we don't allow bots in General
    droid.listener.ignore('#general');
    droid.listener.on('error', function (err) {
      // print to stderr, or sent to error reporting service
      // TODO: Send error messages and audit logs using a log droid
      console.error(err);
    });

    gynoid.droids[name] = droid;

    // Starting the listener blocks the action
    async.parallel([
      function() { return droid.listener.start(); },
      function() { console.log('Droid %s added to the registry', name); return resolve(droid); }
    ]);
  });
};

Gynoid.prototype.unregisterDroid = function(name) {
  var gynoid = this;
  return new Promise(function (resolve, reject) {
    if (!gynoid.droids[name]) {
      return reject({error: 'droid_unknown', message: 'Could not find droid ' + name + ' in the registry.'});
    }

    var droid = gynoid.droids[name];
    if (droid.system) {
      return reject({error: 'droid_system', message: 'Cannot unregister a system droid.'});
    }

    droid.listener.disconnect();
    delete gynoid.droids[name];
    gynoid.configuration.removeDroid(name);
    console.log('Droid %s unregistry', name);
    return resolve();
  });
};

Gynoid.prototype.installFromGitHub = function(name, repository) {
  var gynoid = this;

  // First clone from GitHub, then add the extension as usual
  return gynoid.installer.downloadExtensionFromGitHub(repository)
    .then(function() {
      console.log('Extension %s download. Installing...', repository);
      var extension = repository.split('/')[1];
      return gynoid.addExtension(name, extension);
  });
};

Gynoid.prototype.addExtension = function(name, extension) {
  var gynoid = this;
  console.log('Adding extension %s for %s', extension, name);
  return new Promise(function(resolve, reject) {
    // Extension Validations
    if (!gynoid.droids[name]) {
      return reject({error: 'droid_unknown', message: 'Could not find droid ' + name + ' in the registry.'});
    }

    var droid = gynoid.droids[name];
    return gynoid.extensions.isValidExtension(droid, extension)
      .then(function() {
        var spec = gynoid.extensions.getExtensionFile(extension, 'droid.json');
        return gynoid.installer.installDependencies(extension, spec);
      }).then(function() {
        gynoid.configuration.addExtension(name, extension);
        if (droid.extensions.indexOf(extension) === -1) {
          droid.extensions.push(extension);
        }

        gynoid.extensions.extend(droid, extension)
          .then(function() { return resolve(droid); });
      }).catch(function(err) {
        return reject(err);
    });
  });
};

Gynoid.prototype.removeExtension = function(name, extension) {
  var gynoid = this;
  console.log('Removing extension %s for %s', extension, name);
  return new Promise(function (resolve, reject) {
    if (!gynoid.droids[name]) {
      return reject({error: 'droid_unknown', message: 'Could not find droid ' + name + ' in the registry.'});
    }

    var droid = gynoid.droids[name];
    return gynoid.extensions.removeExtension(droid, extension)
      .then(function() {
        return gynoid.removeFromConfiguration(name, extension);
    }).catch(function(err) {
      console.error(err);
      throw err;
    });
  });
};

Gynoid.prototype.removeFromConfiguration = function(name, extension) {
  var gynoid = this;
  return new Promise(function(resolve, reject) {
    // Remove the extension from the droid's configuration
    var index = gynoid.droids[name].extensions.indexOf(extension);
    gynoid.droids[name].extensions.splice(index, 1);
    try {
      gynoid.configuration.removeExtension(name, extension);
      return resolve();
    } catch(err) {
      return reject(err);
    }
  });
};

Gynoid.prototype.addKey = function(droid, key, value) {
  this.configuration.addKey(droid, key, value);
};

Gynoid.prototype.removeKey = function(droid, key) {
  this.configuration.removeKey(droid, key);
};

Gynoid.prototype.listKeys = function(droid) {
  return this.configuration.listKeys(droid);
};

Gynoid.prototype.listAllKeys = function() {
  return this.configuration.listAllKeys();
};

module.exports = Gynoid;
