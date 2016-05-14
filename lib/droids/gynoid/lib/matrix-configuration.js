var fs = require('fs');

module.exports = {
  read: function(configPath) {
    return require(configPath);
  },
  update: function(configPath, data) {
    try {
      fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
    } catch(err) {
      throw new Error({error: 'config_error', message: 'Unable to write configuration file.' + err.toString() });
    }
  }
};
