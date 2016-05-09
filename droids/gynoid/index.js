var git = require('nodegit');
var githubUrl = 'git@github.com:';

var SlackDroid = require('slack-robot');
var acls = require('./acls');
var npm = require('npm');
var webtaskRunner = require('./webtask-runner');
var env = require('../../env');

function addListeners(spec, droid) {
  // Add Listener functions to this droid
  spec.actions.forEach(function(action) {
    var listenerFunction;
    var commandFunction;

    // If the action requires a Webtask runner, we wrap the function
    if (action.webtask) {
      commandFunction = function(req, res, next) {
        return webtaskRunner(action.webtask, req, res, next);
      };
    } else {
      commandFunction = droid.functions[action.function];
    }

    // Check if a premessage is configured. We write this message in Slack before calling our command
    if (action.premessage) {
      listenerFunction = function(req, res, next) {
        res.text(action.premessage).send();
        return commandFunction(req, res, next);
      };
    } else {
      listenerFunction = commandFunction;
    }

    // The same action might have multiple aliases. Add one listener per alias.
    action.aliases.forEach(function(alias) {
      var listener = droid.listener.listen(alias, listenerFunction);
      if (action.acls) {
        // The action has ACLs. Each ACL is defined in the ACL file
        for (var acl in action.acls) {
          listener.acl(acls[acl]);
        }
      }
    });
  });
}

function createNpmDependenciesArray(dependencies) {
  if (!dependencies) {
    return [];
  }

  var deps = [];
  for (var mod in dependencies) {
      deps.push(mod + "@" + dependencies[mod]);
  }

  return deps;
}

function installPackages(dependencies, callback) {
  // TODO: Error handling
  console.log('Installing dependencies...');
  var packages = createNpmDependenciesArray(dependencies);
  npm.load(function () {
    // catch errors
    npm.commands.install(packages, function (er) {
      // log the error or data
      return callback(er);
    });
  });
}

function addDroid(specPath, callback) {
  var spec = require(specPath + '/droid.json');
  console.log('Adding new droid:', spec.name);

  installPackages(spec.dependencies, function(err) {
    if (err) {
      return console.error(err);
    }

    // Look for Slack Token - By convention {NAME}_BOT_TOKEN
    var token = env[spec.name.toUpperCase() + '_BOT_TOKEN'];
    var droid = {
      listener: new SlackDroid(token)
    };

    if (spec.script) {
      droid.functions = require(specPath + '/' + spec.script);
    }

    addListeners(spec, droid);
    // By convention, we don't allow bots in General
    droid.listener.ignore('#general');
    droid.listener.on('error', function (err) {
      // print to stderr, or sent to error reporting service
      console.error(err);
    });

    droid.listener.start();
    if (callback) {
      return callback();  
    }

  });
}

module.exports = {
  installDroid: function(req, res) {
    var repository = req.params.repo;

    // TODO: Error handling and validation
    var repoUrl = githubUrl + repository + '.git';
    var opts = {
      fetchOpts: {
        callbacks: {
          certificateCheck: function() {
            return 1;
          },
          credentials: function(url, userName) {
            console.log('Credentials', url, userName);
            return git.Cred.sshKeyFromAgent(userName);
          }
        }
      }
    };

    console.log('Cloning droid repository...');
    git.Clone(repoUrl, __dirname + '/../' + repository.split('/')[1], opts)
      .then(function(repo) {
        console.log ('Repo', repo);
        addDroid(__dirname + '/../' + repository.split('/')[1]);
      })
      .catch(function(err) {
        console.error(err);
        res.text('Unable to install droid from ' + repository + '\n\n```' + err + '```');
      });
  },
  initialize: function() {
    addDroid(__dirname + '/../gynoid', function() {
      console.log('Done!');
    });
  },
  startDroid: function(req, res) {
    addDroid(__dirname + '/../' + req.params.name, function() {
      res.text('Droid started').send();
    });
  }
};
