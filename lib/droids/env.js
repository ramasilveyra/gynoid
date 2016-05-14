var env = process.env;
process.env.LOG_LEVEL = 'fatal';
env.GYNOID_CONFIG_PATH = __dirname + '/gynoid/config.json';

module.exports = env;
