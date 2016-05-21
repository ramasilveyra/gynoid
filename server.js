var gynoid = require('./index');

console.log('Loading Droids...');
gynoid.loadDroids()
  .then(function() {
    if (!gynoid.droids['gynoid']) {
      return gynoid.registerDroid('gynoid', process.env.GYNOID_TOKEN)
        .then(function() {
          return gynoid.installFromGitHub('gynoid', process.env.DEFAULT_GYNOID_EXTENSION);
        });
    }
  })
  .catch(function(err) {
    console.error(err);
  });
