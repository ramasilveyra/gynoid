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
        winston.info('Done!');
      })
      .catch(function(err) {
        return winston.error(err);
      });
  },
  registerDroid: function(req, res) {
    if (!req.params.bot) {
      return res.text('What\'s the bot name?').send();
    }

    if (!req.params.token) {
      return res.text('Please specify a token for the bot').send();
    }

    matrix.registerDroid(req.params.bot, req.params.token, function(err) {
      if (err) {
        winston.error(err);
        return res.text(err.message).send();
      }

      return res.text('Droid registered').send();
    });
  },
  installDroid: function(req, res) {
    matrix.installDroid(req, res);
  },
  removeDroid: function(req, res) {
    matrix.removeDroid(req, res);
  },
  startDroid: function(req, res) {
    matrix.startDroid(__dirname + '/../' + req.params.name, function() {
      res.text('Droid started').send();
    });
  }
};
