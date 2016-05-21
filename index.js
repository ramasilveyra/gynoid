var Gynoid = require('./lib/gynoid');
var SlackAdapter = require('slack-robot');

var gynoid = new Gynoid(SlackAdapter);
module.exports = gynoid;
