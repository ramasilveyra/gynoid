var Gynoid = require('./lib/gynoid');
var SlackAdapter = require('slack-robot');

module.exports = new Gynoid(SlackAdapter);
