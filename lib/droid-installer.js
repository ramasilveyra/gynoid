var Promise = require('bluebird');
var env = require('./env');
var fs = require('fs');
var path = require('path');
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
            if (env.GITHUB_TOKEN) {
              return git.Cred.userpassPlaintextNew(env.GITHUB_TOKEN, "x-oauth-basic");
            }
          }
        }
      }
    };

    var droidName = repository.split('/')[1];
    var targetDir = path.join(env.GYNOID_INSTALL_PATH, droidName);
    rimraf.sync(targetDir);
    return git.Clone(repoUrl, targetDir, opts);
};

DroidInstaller.prototype.installDependencies = function(extension, spec) {
  var droidName = spec.name;
  var droidCwd = path.join(env.GYNOID_INSTALL_PATH, extension);

  return new Promise(function(resolve, reject) {
    fs.stat(path.join(droidCwd, 'package.json'), function (err) {
      if (err) {
        console.log('No dependencies to install for droid `' + droidName + '`');
        return resolve();
      }

      console.log('Installing `' + droidName + '` droid dependencies...');
      installDependencies();
    });

    function installDependencies() {
      exec('npm install', {
        cwd: droidCwd
      }, function installDependenciesCallback(err, stdout, stderr) {
        console.log(stderr);
        console.log(stdout);

        if (err) {
          var msg = 'ERROR while installing `' + droidName + '` droid dependencies. Error: ' + JSON.stringify(err, null, 2);
          console.error(msg);
          return reject(msg);
        }

        console.log('Dependencies of `' + droidName + '` droid successfully installed.');
        resolve();
      });
    }
  });
};

module.exports = DroidInstaller;
