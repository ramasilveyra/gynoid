var DroidMatrix = require('./droid-matrix');
var matrix = new DroidMatrix();

module.exports = {
  initialize: function() {
    matrix.registerDroid(__dirname + '/../gynoid', function() {
      console.log('Done!');
    });
  },
  installDroid: function(req, res) {
    matrix.installDroid(req, res);
  },
  removeDroid: function(req, res) {
    matrix.removeDroid(req, res);
  },
  startDroid: function(req, res) {
    matrix.registerDroid(__dirname + '/../' + req.params.name, function() {
      res.text('Droid started').send();
    });
  }
};
