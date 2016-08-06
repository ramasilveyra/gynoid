var fs = require('fs');
var path = require('path');
var env = {};

if (!env.GYNOID_CONFIG_PATH) {
  env.GYNOID_CONFIG_PATH = process.cwd() + '/gynoid.config.json';
}

// Get all environment keys from config file
var content = fs.readFileSync(env.GYNOID_CONFIG_PATH);
var gynoidConfig = JSON.parse(content);
for (var key in gynoidConfig.keys) {
  env[key] = gynoidConfig.keys[key];
}

if (!env.GYNOID_INSTALL_PATH) {
  env.GYNOID_INSTALL_PATH = path.join(process.cwd(), 'droids');
}

if (!env.DEFAULT_GYNOID_EXTENSION) {
  env.DEFAULT_GYNOID_EXTENSION = 'auth0/gynoid-droid';
}

module.exports = env;
