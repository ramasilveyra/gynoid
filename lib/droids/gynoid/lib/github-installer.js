var winston = require('winston');
var env = require('../../env');

module.exports = function(repository) {
  var git = require('nodegit');
  var rimraf = require('rimraf');

  // TODO: Error handling and validation
  var repoUrl = 'git@github.com:' + repository + '.git';
  var opts = {
    fetchOpts: {
      callbacks: {
        certificateCheck: function() {
          return 1;
        },
        credentials: function(url, userName) {
          return git.Cred.sshKeyFromAgent(userName);
        }
      }
    }
  };

  winston.info('Cloning droid repository: ' + repository);
  var droidName = repository.split('/')[1];
  var targetDir = env.GYNOID_INSTALL_PATH + droidName;

  console.log('Target Dir', targetDir);
  rimraf.sync(targetDir);
  return git.Clone(repoUrl, targetDir, opts);
};
