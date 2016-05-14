var DroidMatrix = require('./lib/droid-matrix');
var matrix;
var winston = require('winston');
var env = require('../env');

module.exports = {
  initialize: function(Adapter) {
    matrix = new DroidMatrix(Adapter);
    var config = matrix.configuration.read(env.GYNOID_CONFIG_PATH);
    // Initialize and do not save configuration
    matrix.registerDroid('gynoid', config.gynoid_token, true)
      .then(function() {
        winston.info('Gynoid registered.');
        var spec = require('./droid.json');
        var coreFunctions = require('./index');
        return matrix.extendDroid(spec, coreFunctions);
      })
      .then(function() {
        winston.info('Gynoid initialized.');
      })
      .catch(function(err) {
        return winston.error(err);
      });
  },
  installDroid: function(req, res) {
    console.log('hello');
    var repository = req.params.repo;
    var token = req.params.token;

    if (!repository) {
      return res.text('Repository not specified. Use the format: user/repo').send();
    }

    if (!token) {
      return res.text('Droid token not specified').send();
    }

    var installFromGitHub = require('./lib/github-installer');
    var dependencyInstall = require('./lib/dependency-installer');
    var spec, folder;
    installFromGitHub(repository)
      .then(function() {
        folder = env.GYNOID_INSTALL_PATH + '/' + repository.split('/')[1];
        try {
          spec = require(folder + '/droid.json');
        } catch(err) {
          winston.error(err);
          return res.text('Unable to read droid spec.').send();
        }

        return dependencyInstall(spec.dependencies || {});
      })
      .then(function() {
        var coreFunctions = require(folder + '/' + spec.script);
        matrix.installDroid(spec, coreFunctions, token)
          .then(function(droid) {
            return res.text('Succesfully extended droid ' + droid.name + ' from ' + repository).send();
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
  }
};
