var Promise = require('bluebird');
var DroidMatrix = require('./lib/droid-matrix');
var matrix;
var winston = require('winston');
var env = require('../env');
var installFromGitHub = require('./lib/github-installer');
var dependencyInstall = require('./lib/dependency-installer');

module.exports = {
  initialize: function(Adapter) {
    matrix = new DroidMatrix(Adapter);
    var config = matrix.configuration.read(env.GYNOID_CONFIG_PATH);

    Promise.map(Object.keys(config.droids), function(droid) {
      return matrix.registerDroid(droid, config.droids[droid].token, true)
        .then(function() {
          winston.info(droid + ' registered.');
          return Promise.map(config.droids[droid].extensions, function(extension) {
            var spec = require(env.GYNOID_INSTALL_PATH + '/' + extension + '/droid.json');
            return dependencyInstall(spec.dependencies || {})
              .then(function() {
                var corePath = env.GYNOID_INSTALL_PATH + '/' + extension + '/' + spec.script;
                var coreFunctions = require(corePath);
                return matrix.extendDroid(spec, coreFunctions);
              });

          });
      });
    })
    .then(function() {
      // DONE
    })
    .catch(function(err) {
      console.error(err);
    });
  },
  installDroid: function(req, res) {
    var repository = req.params.repo;
    var token = req.params.token;

    if (!repository) {
      return res.text('Repository not specified. Use the format: user/repo').send();
    }

    if (!token) {
      return res.text('Droid token not specified').send();
    }

    var spec, folder;
    res.text('Installing from GitHub: ' + repository).send();
    installFromGitHub(repository)
      .then(function() {
        folder = env.GYNOID_INSTALL_PATH + '/' + repository.split('/')[1];
        try {
          spec = require(folder + '/droid.json');
        } catch(err) {
          winston.error(err);
          return res.text('Unable to read droid spec.').send();
        }

        res.text('Repository cloned. Installing dependencies...').send();
        return dependencyInstall(spec.dependencies || {});
      })
      .then(function() {
        var corePath = folder + '/' + spec.script;
        delete require.cache[require.resolve(corePath)];
        var coreFunctions = require(corePath);
        res.text('Done. Installing droid...').send();
        matrix.installDroid(spec, coreFunctions, token, repository.split('/')[1])
          .then(function(droid) {
            return res.text('Succesfully extended droid *' + droid.name + '* from ' + repository).send();
          })
          .catch(function(err) {
            winston.error(err);
            return res.text('Unable to install droid. ' + JSON.stringify(err)).send();
          });
      })
      .catch(function(err) {
        winston.error(err);
        res.text('Unable to install droid from ' + repository + '\n\n```' + err + '```').send();
      });
  },
  extendDroid: function(req, res) {
    var repository = req.params.repo;

    if (!repository) {
      return res.text('Repository not specified. Use the format: user/repo').send();
    }

    var installFromGitHub = require('./lib/github-installer');
    var dependencyInstall = require('./lib/dependency-installer');
    var spec, folder;
    res.text('Extending from GitHub: ' + repository).send();
    installFromGitHub(repository)
      .then(function() {
        folder = env.GYNOID_INSTALL_PATH + '/' + repository.split('/')[1];
        try {
          spec = require(folder + '/droid.json');
        } catch(err) {
          winston.error(err);
          return res.text('Unable to read droid spec.').send();
        }

        res.text('Repository cloned. Installing dependencies...').send();
        return dependencyInstall(spec.dependencies || {});
      })
      .then(function() {
        var corePath = folder + '/' + spec.script;
        delete require.cache[require.resolve(corePath)];
        var coreFunctions = require(corePath);
        res.text('Done. Installing droid...').send();
        matrix.extendDroid(spec, coreFunctions, repository.split('/')[1])
          .then(function(droid) {
            return res.text('Succesfully extended droid *' + droid.name + '* from ' + repository).send();
          })
          .catch(function(err) {
            winston.error(err);
            return res.text('Unable to install droid. ' + JSON.stringify(err)).send();
          });
      })
      .catch(function(err) {
        winston.error(err);
        res.text('Unable to install droid from ' + repository + '\n\n```' + err + '```').send();
      });
  },
  removeDroid: function(req, res) {
    var droid = req.params.droid;

    if (!droid) {
      return res.text('Missing droid name').send();
    }

    matrix.unregisterDroid(droid)
      .then(function() {
        return res.text('Droid ' + droid + ' removed').send();
      })
      .catch(function(err) {
        return res.text('An error has occurred when trying to unregister droid.' + '\n\n```' + JSON.stringify(err) + '```').send();
      });
  },
  reloadDroid: function(req, res) {
    var droid = req.params.droid;

    if (!droid) {
      return res.text('Missing droid name').send();
    }

    matrix.unregisterDroid(droid, true)
      .then(function() {
        var config = matrix.configuration.read(env.GYNOID_CONFIG_PATH);
        return matrix.registerDroid(droid, config.droids[droid].token, true)
          .then(function() {
            winston.info(droid + ' registered.');
            return Promise.map(config.droids[droid].extensions, function(extension) {
              var spec = require(env.GYNOID_INSTALL_PATH + '/' + extension + '/droid.json');
              var corePath = env.GYNOID_INSTALL_PATH + '/' + extension + '/' + spec.script;
              delete require.cache[require.resolve(corePath)];
              var coreFunctions = require(corePath);
              return matrix.extendDroid(spec, coreFunctions);
            });
        });
      })
      .then(function() {
        return res.text('Droid reloaded').send();
      })
      .catch(function(err) {
        return res.text('An error has occurred when trying to reload droid.' + '\n\n```' + JSON.stringify(err) + '```').send();
      });
  },
  listDroids: function(req, res) {
    matrix.listDroids()
      .then(function(droids) {
        return res.text('Installed droids:\n\n- ' + droids.join('\n- ')).send();
      });
  },
  addKey: function(req, res) {
    var key = req.params.key;
    var value = req.params.value;

    if (!key || !value) {
      return res.text('Missing key or value.').send();
    }

    matrix.addKey(key, value)
      .then(function() {
        return res.text('Key added').send();
      })
      .catch(function(err) {
        return res.text('An error has occurred when trying to save key.' + '\n\n```' + err + '```').send();
      });
  },
  removeKey: function(req, res) {
    var key = req.params.key;

    if (!key) {
      return res.text('Missing key or value.').send();
    }

    matrix.removeKey(key)
      .then(function() {
        return res.text('Key removed').send();
      })
      .catch(function(err) {
        return res.text('An error has occurred when trying to remove key.' + '\n\n```' + err + '```').send();
      });
  }
};
