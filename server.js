// TODO: Refactor this. Testing purposes only.

var env = require('dotenv');
env.load({silent:true});

var async = require('async');

var Matrix = require('./matrix');
var matrix = new Matrix(process.env.SLACK_TOKEN);

var mandrillDroid = require('./droids/mandrill/mandrill.json');
var valkyrieDroid = require('./droids/valkyrie/valkyrie.json');

async.parallel([
  function() { matrix.addDroid(mandrillDroid); },
  function() { matrix.addDroid(valkyrieDroid); }
], function() {
  console.log('Droids initialized!');
});
