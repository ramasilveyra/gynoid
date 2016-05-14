var env = process.env;
process.env.LOG_LEVEL = 'fatal';

if (!env.GYNOID_CONFIG_PATH) {
  env.GYNOID_CONFIG_PATH = '/etc/gynoid.config.json';
}

if (!env.GYNOID_INSTALL_PATH) {
  env.GYNOID_INSTALL_PATH = __dirname;
}

module.exports = env;
