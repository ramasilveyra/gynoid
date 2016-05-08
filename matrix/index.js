var SlackDroid = require('slack-robot');
var acls = require('./acls');
var npm = require('npm');
var webtaskRunner = require('./webtask-runner');
var env = require('../env');

var Matrix = function() {
  this.droids = {};
};

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
  npm.load({
    loaded: false
  }, function () {
    // catch errors
    npm.commands.install(packages, function (er) {
      // log the error or data
      return callback(er);
    });
  });
}

Matrix.prototype.addDroid = function(spec) {
  console.log('Adding new droid: ', spec.name);
  // Check if droid is already registered or if it is an update
  if (!this.droids[spec.name]){
    // Look for Slack Token - By convention {NAME}_BOT_TOKEN
    var token = env[spec.name.toUpperCase() + '_BOT_TOKEN'];
    this.droids[spec.name] = {
      listener: new SlackDroid(token)
    };

    if (spec.script) {
      this.droids[spec.name].functions = require('../droids/' + spec.script);
    }
  }

  var matrix = this;
  var droid = matrix.droids[spec.name];

  addListeners(spec, droid);
  installPackages(spec.dependencies, function(err) {
    if (err) {
      return console.error(err);
    }

    droid.listener.on('error', function (err) {
      // print to stderr, or sent to error reporting service
      console.error(err);
    });

    // By convention, we don't allow bots in General
    droid.listener.ignore('#general');
    droid.listener.start();
  });
};

Matrix.prototype.start = function() {
  // ignore message from '#general' channel, even if it matches the listener
  this.robot.ignore('#general');

  // start listening
  this.robot.start();
};

module.exports = Matrix;
