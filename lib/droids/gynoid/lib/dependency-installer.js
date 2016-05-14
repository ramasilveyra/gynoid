var npm = require('npm');
var Promise = require('bluebird');

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

module.exports = function installPackages(dependencies) {
  return new Promise(function(resolve, reject) {
    // TODO: Error handling
    console.log('Installing dependencies...');
    var packages = createNpmDependenciesArray(dependencies);
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
