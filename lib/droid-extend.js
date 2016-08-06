var droidAcls = require('./droid-acls');
var env = require('./env');
var path = require('path');
var Promise = require('bluebird');

var DroidExtend = function(gynoid) {
  this.gynoid = gynoid;
};

DroidExtend.prototype.getExtensionFile = function(extension, filename) {
  filename = filename || 'droid.json';
  try {
    var filePath = path.join(env.GYNOID_INSTALL_PATH, extension, filename);
    var resolvedCache = require.cache[require.resolve(filePath)];
    if (resolvedCache) {
      resolvedCache.children.forEach(function(child) {
        delete require.cache[require.resolve(child.id)];
      });
    }

    delete require.cache[require.resolve(filePath)];
    return require(filePath);
  } catch (err) {
    var msg = 'Unable to read extension file: ' + filename + ' - extension: ' + extension + ' - ' + JSON.stringify(err, null, 2);
    console.error(msg);
    throw new Error(err);
  }
};

DroidExtend.prototype.isValidExtension = function(droid, extension) {
  var extend = this;
  return new Promise(function(resolve, reject) {
    var spec = extend.getExtensionFile(extension);
    if (!spec) {
      return reject({error: 'spec_not_found', message: 'Could not find spec droid.json for extension ' + extension});
    }

    return resolve(droid);
  });
};

DroidExtend.prototype.extend = function(droid, extension) {
  var extend = this;
  return new Promise(function(resolve, reject) {
    try {
      console.log('Installing %s for %s', extension, droid.name);
      var coreFunctions;
      var spec = extend.getExtensionFile(extension);
      var droidMethods = extend.getExtensionFile(extension, spec.script);
      var functionOptions = { config: env[droid.name] };

      if (droid.name === 'gynoid') {
        functionOptions.gynoid = extend.gynoid;
      }

      coreFunctions = droidMethods(functionOptions);
      spec.actions.forEach(function(action) {
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

          var listener = droid.listener.listen(alias, coreFunction);
          if (action.acls) {
            listener.acl(droidAcls(action.acls));
          }
        });
      });
    } catch(err) {
      console.error('An error has occured while extending a droid', err);
      return reject(err);
    }

    console.log('Extension %s installed', extension);
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
