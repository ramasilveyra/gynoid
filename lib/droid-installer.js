var npm = require('npm');
var Promise = require('bluebird');
var env = require('./env');
var path = require('path');

var DroidInstaller = function() {};

DroidInstaller.prototype.downloadExtensionFromGitHub = function(repository) {
    var git = require('nodegit');
    var rimraf = require('rimraf');

    // TODO: Error handling and validation
    var repoUrl = 'git@github.com:' + repository + '.git';
    var opts = {
      fetchOpts: {
        callbacks: {
          certificateCheck: function() {
            return 1;
          },
          credentials: function(url, userName) {
            var cred = git.Cred.sshKeyFromAgent(userName);
            return cred;
          }
        }
      }
    };

    var droidName = repository.split('/')[1];
    var targetDir = path.join(env.GYNOID_INSTALL_PATH, droidName);
    rimraf.sync(targetDir);
    return git.Clone(repoUrl, targetDir, opts);
};


function createNpmDependenciesArray(dependencies) {
  if (!dependencies) {
    return [];
  }

  var deps = [];
  for (var mod in dependencies) {
      deps.push(mod + "@" + dependencies[mod]);
  }

  return deps;
}

DroidInstaller.prototype.installDependencies = function(spec) {
  return new Promise(function(resolve, reject) {
    if (!spec.dependencies) {
      return resolve();
    }

    // TODO: Error handling
    console.log('Installing dependencies...');
    var packages = createNpmDependenciesArray(spec.dependencies);
    if (packages.length === 0) {
      return resolve();
    }

    npm.load(function () {
      // catch errors
      npm.commands.install(packages, function (err) {
        if (err) {
          return reject(err);
        }

        return resolve(err);
      });
    });
  });
};

module.exports = DroidInstaller;
