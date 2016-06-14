var Promise = require('bluebird');
var env = require('./env');
var path = require('path');
var semver = require('semver');
var exec = require('child_process').exec;

var DroidInstaller = function() {};

DroidInstaller.prototype.downloadExtensionFromGitHub = function(repository) {
    var git = require('nodegit');
    var rimraf = require('rimraf');

    // TODO: Error handling and validation
    var repoUrl = 'https://github.com/' + repository;
    var opts = {
      fetchOpts: {
        callbacks: {
          certificateCheck: function() {
            return 1;
          },
          credentials: function() {
            return git.Cred.userpassPlaintextNew(env.GITHUB_TOKEN, "x-oauth-basic");
          }
        }
      }
    };

    var droidName = repository.split('/')[1];
    var targetDir = path.join(env.GYNOID_INSTALL_PATH, droidName);
    rimraf.sync(targetDir);
    return git.Clone(repoUrl, targetDir, opts);
};

DroidInstaller.prototype.installDependencies = function(spec) {
  var droidName = spec.name;
  var cwd = path.join(env.GYNOID_INSTALL_PATH, droidName);

  return new Promise(function(resolve, reject) {
    console.log('Installing `' + droidName + '` droid dependencies...')

    exec('npm install', {
      cwd: cwd
    }, function installDependenciesCallback(err) {
      if (err) {
        console.error('ERROR while installing `' + droidName + '` droid dependencies.')
        return reject(err);
      }

      console.log('Dependencies of `' + droidName + '` droid successfully installed.');
      resolve();
    });
  });
};

module.exports = DroidInstaller;
