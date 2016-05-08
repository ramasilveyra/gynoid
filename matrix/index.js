var SlackDroid = require('slack-robot');
var acls = require('./acls');
var npm = require('npm');
var webtaskRunner = require('./webtask-runner');

var Matrix = function() {
  this.droids = {};
};

Matrix.prototype.addDroid = function(spec) {
  if (!this.droids[spec.name]){
    var token = process.env[spec.name.toUpperCase() + '_BOT_TOKEN'];
    this.droids[spec.name] = {
      listener: new SlackDroid(token)
    };

    if (spec.script) {
      this.droids[spec.name].functions = require('../droids/' + spec.script);
    }
  }

  var matrix = this;
  var droid = matrix.droids[spec.name];
  spec.actions.forEach(function(action) {
    var listenerFunction;
    var commandFunction;

    if (action.webtask) {
      commandFunction = function(req, res, next) {
        return webtaskRunner(action.webtask, req, res, next);
      }
    } else {
      commandFunction = droid.functions[action.function];
    }

    if (action.premessage) {
      listenerFunction = function(req, res, next) {
        res.text(action.premessage).send();
        return commandFunction(req, res, next);
      }
    } else {
      listenerFunction = commandFunction;
    }


    action.aliases.forEach(function(alias) {


      var listener = droid.listener.listen(alias, listenerFunction);
      if (action.acls) {
        for (var acl in action.acls) {
          listener.acl(acls[acl]);
        }
      }
    });
  });

  var depsArray = createNpmDependenciesArray(spec.dependencies);
  matrix.installPackages(depsArray, function(err) {
    if (err) {
      return console.error(err);
    }

    droid.listener.on('error', function (err) {
      // print to stderr, or sent to error reporting service
      console.error(err);
    });

    droid.listener.ignore('#general');
    droid.listener.start();
  });
};

Matrix.prototype.installPackages = function(packages, callback) {
  npm.load({
    loaded: false
  }, function (err) {
    // catch errors
    npm.commands.install(packages, function (er) {
      // log the error or data
      return callback(er);
    });

    npm.on("log", function (message) {
      // log the progress of the installation
      console.log(message);
    });
  });
}

Matrix.prototype.start = function() {
  // ignore message from '#general' channel, even if it matches the listener
  this.robot.ignore('#general');

  // start listening
  this.robot.start();
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

module.exports = Matrix;
