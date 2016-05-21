var Promise = require('bluebird');
var async = require('async');

var Configuration = require('./configuration');
var env = require('./env');
var DroidExtend = require('./droid-extend');
var DroidInstaller = require('./droid-installer');

var Gynoid = function(Adapter) {
  this.Adapter = Adapter;
  this.configuration = new Configuration(env.GYNOID_CONFIG_PATH);
  this.extensions = new DroidExtend();
  this.installer = new DroidInstaller();
  this.droids = {};
};

Gynoid.prototype.registerDroid = function(name, token) {
  var register = this;
  return new Promise(function (resolve, reject) {
    if (register.droids[name]) {
      return reject({error: 'droid_registered', message: 'Droid ' + name + ' is already register. Please, remove it first.'});
    }

    register.configuration.saveDroid(name, { token: token, extensions: []});
    var droid = {
      name: name,
      listener: new register.Adapter(token),
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

    register.droids[name] = droid;

    // Starting the listener blocks the action
    async.parallel([
      function() { return droid.listener.start(); },
      function() { return resolve(droid);}
    ], function() {
      return resolve(droid);
    });
  });
};

Gynoid.prototype.unregisterDroid = function(name) {
  var register = this;
  return new Promise(function (resolve, reject) {
    if (!register.droids[name]) {
      return reject({error: 'droid_unknown', message: 'Could not find droid ' + name + ' in the registry.'});
    }

    var droid = register.droids[name];
    if (droid.system) {
      return reject({error: 'droid_system', message: 'Cannot unregister a system droid.'});
    }

    droid.listener.disconnect();
    register.configuration.removeDroid(name);
    return resolve();
  });
};

Gynoid.prototype.installFromGitHub = function(name, repository) {
  var register = this;

  // First clone from GitHub, then add the extension as usual
  return register.installer.downloadExtensionFromGitHub(repository)
    .then(function() {
      var extension = repository.split('/')[1];
      return register.addExtension(name, extension);
  });
};

Gynoid.prototype.addExtension = function(name, extension) {
  var register = this;
  return new Promise(function(resolve, reject) {
    // Extension Validations
    if (!register.droids[name]) {
      return reject({error: 'droid_unknown', message: 'Could not find droid ' + name + ' in the registry.'});
    }

    var droid = register.droids[name];
    return register.extensions.isValidExtension(droid, extension)
      .then(function() {
        var spec = register.extensions.getExtensionFile(extension, 'droid.json');
        return register.installer.installDependencies(spec);
      }).then(function() {
        register.configuration.addExtension(name, extension);
        droid.extensions.push(extension);
        register.extensions.extend(droid, extension)
          .then(function() {
            return resolve(droid);
          });
      }).catch(function(err) {
        return reject(err);
      });
  });
};

Gynoid.prototype.removeExtension = function(name, extension) {
  var register = this;
  return new Promise(function (resolve, reject) {
    if (!register.droids[name]) {
      return reject({error: 'droid_unknown', message: 'Could not find droid ' + name + ' in the registry.'});
    }

    var droid = register.droids[name];
    return register.extensions.removeExtension(droid, extension)
      .then(function() {
        // Remove the extension from the droid's configuration
        register.configuration.removeExtension(name, extension);
      });
  });
};

module.exports = Gynoid;
