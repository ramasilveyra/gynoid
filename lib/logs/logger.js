var pkg = require('../../package.json');
// var env = require('../env');
var agent = require('auth0-instrumentation');

agent.init(pkg, process.env);
module.exports = agent.logger;
