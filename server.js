var gynoid = require('./index');
var env = require('./lib/env');

console.log('Loading Droids...');
gynoid.loadDroids()
  .then(function() {
    if (!gynoid.droids['gynoid']) {
      return gynoid.registerDroid('gynoid', env.GYNOID_TOKEN)
        .then(function() {
          return gynoid.installFromGitHub('gynoid', env.DEFAULT_GYNOID_EXTENSION);
        });
    }
  })
  .catch(function(err) {
    console.error(err);
  });
