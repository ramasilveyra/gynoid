var path = require('path');
var env = process.env;
process.env.LOG_LEVEL = 'fatal';

if (!env.GYNOID_CONFIG_PATH) {
  env.GYNOID_CONFIG_PATH = '/etc/gynoid.config.json';
}

// Get all environment keys from config file
var gynoidConfig = require(env.GYNOID_CONFIG_PATH);
for (var key in gynoidConfig.keys) {
  env[key] = gynoidConfig.keys[key];
}

if (!env.GYNOID_INSTALL_PATH) {
  env.GYNOID_INSTALL_PATH = path.join(__dirname, '../droids');
}

if (!env.DEFAULT_GYNOID_EXTENSION) {
  env.DEFAULT_GYNOID_EXTENSION = 'auth0/gynoid-droid';
}

module.exports = env;
