var githubUrl = 'git@github.com:';
var SlackDroid = require('slack-robot');
var acls = require('./acls');
var npm = require('npm');
var webtaskRunner = require('./webtask-runner');
var env = require('../../env');
var async = require('async');


var DroidMatrix = function() {
  this.droidRegistry = {};
};

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
      droid.aliases[alias] = listener.id;
      if (action.acls) {
        // The action has ACLs. Each ACL is defined in the ACL file
        for (var acl in action.acls) {
          listener.acl(acls[acl]);
        }
      }
    });
  });
}

DroidMatrix.prototype.registerDroid = function(specPath, callback) {
  var spec = require(specPath + '/droid.json');
  var matrix = this;

  console.log('Adding new droid:', spec.name);
  installPackages(spec.dependencies, function(err) {
    if (err) {
      return console.error(err);
    }

    // Look for Slack Token - By convention {NAME}_BOT_TOKEN
    var token = env[spec.name.toUpperCase() + '_BOT_TOKEN'];
    var droid = {
      listener: new SlackDroid(token),
      aliases: {}
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

    async.parallel([
      function() { droid.listener.start(); },
      function() {
        matrix.droidRegistry[spec.name] = droid;
        if (callback) {
          return callback();
        }
      }
    ]);
  });
};

DroidMatrix.prototype.removeDroid = function(req, res) {
  var droid = this.droidRegistry[req.params.name];
  if (!droid) {
    return res.text('There\'s no bot named %s in my records.', req.params.name).send();
  }

  console.log('Removing listeners...');
  for (var alias in droid.aliases) {
    console.log('Removing %s with id %s', alias, droid.aliases[alias]);
    droid.listener.removeListener(droid.aliases[alias]);
  }

  var listeners = droid.listener.getAllListeners();
  console.log('Getting listeners...');
  if (listeners.length === 0) {
    // No more listeners registered for this bot. We can stop it.
    console.log('No more listeners');
    res.text('Droid was removed').send();
    return droid.listener.disconnect();
  }
};

DroidMatrix.prototype.installDroid = function(req, res) {
  var git = require('nodegit');
  var rimraf = require('rimraf');
  var repository = req.params.repo;
  var matrix = this;

  // TODO: Error handling and validation
  var repoUrl = githubUrl + repository + '.git';
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

  console.log('Cloning droid repository...');
  var droidName = repository.split('/')[1];
  var targetDir = __dirname + '/../' + droidName;

  rimraf.sync(targetDir);
  git.Clone(repoUrl, targetDir, opts)
    .then(function() {
      matrix.registerDroid(__dirname + '/../' + droidName, function() {
        res.text('Droid installed.').send();
      });
    })
    .catch(function(err) {
      console.error(err);
      res.text('Unable to install droid from ' + repository + '\n\n```' + err + '```').send();
    });
};

module.exports = DroidMatrix;
