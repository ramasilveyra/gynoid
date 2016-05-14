var Promise = require('bluebird');
var acls = require('./acls');
// var webtaskRunner = require('./webtask-runner');
var async = require('async');
var env = require('../../env');

var DroidMatrix = function(Adapter) {
  this.Adapter = Adapter;
  this.configuration = require('./matrix-configuration');
  this.droidRegistry = {};
};

DroidMatrix.prototype.registerDroid = function(botName, token, initialization) {
  var matrix = this;
  return new Promise(function (resolve, reject) {
    if (matrix.droidRegistry[botName]) {
      return reject({error: 'droid_registered', message: 'Droid ' + botName + ' is already register. Please, remove it first.'});
    }

    if (!initialization) {
      // Save new configuration
      var configuration = matrix.configuration.read(env.GYNOID_CONFIG_PATH);
      configuration[botName + '_token'] = token;
      try {
        matrix.configuration.update(env.GYNOID_CONFIG_PATH, configuration);
      } catch(err) {
        return reject(err);
      }
    }

    var droid = {
      name: botName,
      listener: new matrix.Adapter(token),
      extendable: true, // All droids are extendable until a droid spec says otherwise
      actions: {},
      aliases: {}
    };

    // By convention, we don't allow bots in General
    droid.listener.ignore('#general');
    droid.listener.on('error', function (err) {
      // print to stderr, or sent to error reporting service
      console.error(err);
    });

    async.parallel([
      function() { droid.listener.start(); },
      function() {
        matrix.droidRegistry[botName] = droid;
        return resolve(droid);
      }
    ]);
  });
};

DroidMatrix.prototype.unregisterDroid = function(botName) {
  var matrix = this;
  return new Promise(function (resolve, reject) {
    if (!matrix.droidRegistry[botName]) {
      return reject({error: 'droid_unknown', message: 'Could not find droid ' + botName + ' in the registry.'});
    }

    var configuration = matrix.configuration.read(env.GYNOID_CONFIG_PATH);
    var droid = matrix.droidRegistry[botName];
    async.parallel([
      function() { droid.listener.disconnect(); },
      function() {
        delete matrix.droidRegistry[botName];
        delete configuration[botName];
        try {
          matrix.configuration.update(env.GYNOID_CONFIG_PATH, configuration);
        } catch(err) {
          return reject(err);
        }

        return resolve(droid);
      }
    ]);
  });
};

DroidMatrix.prototype.extendDroid = function(spec, core) {
  var matrix = this;
  return new Promise(function(resolve, reject) {
    if (!spec) {
      return reject({error: 'spec_invalid', message: 'Invalid droid spec.'});
    }

    if (!core) {
      return reject({error: 'core_invalid', message: 'Invalid droid core functions.'});
    }

    if (!matrix.droidRegistry[spec.name]) {
      return reject({error: 'droid_unknown', message: 'Could not find droid ' + spec.name + ' in the registry.'});
    }

    var droid = matrix.droidRegistry[spec.name];
    if (!droid.extendable) {
      return reject({error: 'droid_not_extendable', message: 'This droid cannot be extended with new functions.'});
    }

    if (spec.hasOwnProperty('extendable')) {
      droid.extendable = spec.extendable;
    }

    spec.actions.forEach(function(action) {
      if (droid.actions[action.function]) {
        return reject({error: 'function_override', message: 'Cannot override existing droid function'});
      }

      droid.actions[action.function] = {};
      action.aliases.forEach(function(alias) {
        if (droid.aliases[alias]) {
          return reject({error: 'alias_override', message: 'Cannot override existing function alias'});
        }

        if (!core[action.function]) {
          // Action not found in the droid's core functions
          return reject({error: 'action_unknown', message: 'Unable to find action in the droid\'s core functions.'});
        }

        var coreFunction;

        if (action.premessage) {
          coreFunction = function(req, res) {
            res.text(action.premessage).send();
            return core[action.function](req, res);
          };
        } else {
          coreFunction = core[action.function];
        }

        var listener = droid.listener.listen(alias, coreFunction);
        if (action.acls) {
          for (var acl in action.acls) {
            var aclFunction = acls[acl];
            var aclValue = action.acls[acl];
            listener.acl(aclFunction(aclValue));
          }
        }

        droid.aliases[alias] = listener.id;
      });
    });

    return resolve(droid);
  });
};

DroidMatrix.prototype.installDroid = function(spec, coreFunctions, token) {
  var matrix = this;
  return matrix.registerDroid(spec.name, token)
    .then(function() {
      return matrix.extendDroid(spec, coreFunctions);
    });
};

module.exports = DroidMatrix;
