// TODO: Refactor this. We should extract these values from ~/.gynoid.json

var dotenv = require('dotenv');
dotenv.load({silent:true});

var env = {};

env.VALKYRIE_BOT_TOKEN = process.env.VALKYRIE_BOT_TOKEN;
env.MANDRILL_BOT_TOKEN = process.env.MANDRILL_BOT_TOKEN;
env.MANDRILL_KEY = process.env.MANDRILL_KEY;

module.exports = env;
