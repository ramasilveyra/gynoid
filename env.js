// TODO: Refactor this. We should extract these values from ~/.gynoid.json

var dotenv = require('dotenv');
dotenv.load({silent:true});

var env = process.env; // TODO: Refactor

module.exports = env;
