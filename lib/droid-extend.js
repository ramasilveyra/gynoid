var droidAcls = require('./droid-acls');
var env = require('./env');
var path = require('path');
var Promise = require('bluebird');

var DroidExtend = function() {};

DroidExtend.prototype.getExtensionFile = function(extension, filename) {
  filename = filename || 'droid.json';
  try {
    var filePath = path.join(env.GYNOID_INSTALL_PATH, extension, filename);
    delete require.cache[require.resolve(filePath)];
    return require(filePath);
  } catch (err) {
    console.error(err);
    return undefined;
  }
};

DroidExtend.prototype.isValidExtension = function(droid, extension) {
  var extend = this;
  return new Promise(function(resolve, reject) {
    var spec = extend.getExtensionFile(extension);
    if (!spec) {
      return reject({error: 'spec_not_found', message: 'Could not find spec droid.json for extension ' + extension});
    }

    var coreFunctions = extend.getExtensionFile(extension, spec.script);
    if (!coreFunctions) {
      return reject({error: 'functions_not_found', message: 'Could not find droid or load the functions defined in the spec. Extension: ' + extension});
    }

    return resolve(droid);
  });
};

DroidExtend.prototype.extend = function(droid, extension) {
  var extend = this;
  console.log('\tInstalling extension "%s"', extension);
  return new Promise(function(resolve) {
    var spec = extend.getExtensionFile(extension);
    var coreFunctions = extend.getExtensionFile(extension, spec.script);
    spec.actions.forEach(function(action) {
      console.log('\t\tConfiguring aliases for action "%s"', action.function);
      action.aliases.forEach(function(alias) {
        var coreFunction;

        // Add premessage
        if (action.premessage) {
          coreFunction = function(req, res) {
            res.text(action.premessage).send();
            return coreFunctions[action.function](req, res);
          };
        } else {
          coreFunction = coreFunctions[action.function];
        }

        console.log('\t\t\tAdding alias "%s"', alias);
        var listener = droid.listener.listen(alias, coreFunction);
        if (action.acls) {
          listener.acl(droidAcls(action.acls));
        }
      });
    });

    return resolve(droid);
  });
};

DroidExtend.prototype.removeExtension = function(droid, extension) {
  var extend = this;
  return new Promise(function(resolve, reject) {
    if (droid.extensions.indexOf(extension) === -1) {
      return reject({error: 'extension_unknown', message: 'Could not find extension ' + extension + ' in the registry.'});
    }

    var spec = extend.getExtensionFile(extension);
    if (!spec) {
      return reject({error: 'spec_not_found', message: 'Could not find spec droid.json for extension ' + extension});
    }

    // Find all aliases in the spec and remove them from the listener
    var aliases = [];
    spec.actions.forEach(function(action) {
      action.aliases.forEach(function(alias) { aliases.push(alias); });
    });

    var listeners = droid.listener.getAllListeners();
    listeners.forEach(function(listener) {
      if (aliases.indexOf(listener.value) !== -1) {
        droid.listener.removeListener(listener.id);
      }
    });

    return resolve();
  });
};

module.exports = DroidExtend;
