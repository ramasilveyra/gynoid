var Promise = require('bluebird');
var env = require('./env');
var path = require('path');
var semver = require('semver');

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
  var exec = require('child_process').exec;
  return new Promise(function(resolve, reject) {
    if (!spec.dependencies || Object.keys(spec.dependencies).length === 0) {
      return resolve();
    }

    console.log('Installing dependencies for %s...', spec.name);
    // Get installed packages
    exec('npm ls --json', function (error, stdout, stderr) {
      if (!stdout) {
        return reject(stderr);
      }

      var packages = JSON.parse(stdout);
      var packagesToInstall = [];
      Object.keys(spec.dependencies).forEach(function(package) {
        var requiredVersion = spec.dependencies[package];
        var installedVersion = packages.dependencies[package] ? packages.dependencies[package].version : undefined;

        // If both installed and required are semver. Compare and decide if we need to install it
        if (!installedVersion || (semver.valid(installedVersion) && semver.valid(requiredVersion) && !semver.satisfies(installedVersion, requiredVersion))) {
          packagesToInstall.push(package + '@' + requiredVersion);
        }
      });

      if (packagesToInstall.length === 0) {
        return resolve();
      }

      var command = 'npm install ' + packagesToInstall.join(' ');
      console.log('NPM command:', command);
      exec(command, function (error, stdout, stderr) {
        if (stderr) {
          console.log('NPM errors: ' + stderr);
        }

        if (error) {
          console.error(error);
          return reject(error);
        }

        console.log('Dependencies for %s installed', spec.name);
        return resolve();
       });
     });
  });
};

module.exports = DroidInstaller;
