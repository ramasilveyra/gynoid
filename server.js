require('./lib/logs/setup');
var SlackAdapter = require('slack-robot');

var gynoid = require('./lib/droids/gynoid');
gynoid.initialize(SlackAdapter);
