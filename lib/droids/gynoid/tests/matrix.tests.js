/*jshint -W030 */
var expect = require('chai').expect;
var sinon = require('sinon');

describe('Droid Matrix', function() {
  it('should create a droid registry', function(done) {
    // Arrange
    var Matrix = require('../lib/droid-matrix');
    var fakeAdapter = {};

    // Act
    var matrix = new Matrix(fakeAdapter);

    // Expect
    expect(matrix.droidRegistry).to.exist;
    expect(matrix.Adapter).to.exist;
    return done();
  });

  it('should be able to register a new droid', function(done) {
    // Arrange
    var botName = 'test-bot';
    var token = 'fake-token';
    var Matrix = require('../lib/droid-matrix');
    var Adapter = require('./adapter-mock');
    var matrix = new Matrix(Adapter);
    var configMock = sinon.mock(matrix.configuration);
    configMock.expects('read').once().returns({});
    configMock.expects('update').once().returns({});

    // Act
    matrix.registerDroid(botName, token)
      .then(function(droid) {
        // Expect
        expect(droid).to.exist;
        expect(droid.listener).to.exist;
        expect(droid.actions).to.exist;
        expect(droid.aliases).to.exist;
        expect(droid.listener.ignore.calledOnce).to.be.true;
        expect(droid.listener.on.calledOnce).to.be.true;
        expect(droid.listener.start.calledOnce).to.be.true;
        configMock.verify();
        return done();
      });
  });

  it('should be able to unregister an existing droid', function(done) {
    // Arrange
    var botName = 'test-bot';
    var token = 'fake-token';
    var Matrix = require('../lib/droid-matrix');
    var Adapter = require('./adapter-mock');
    var matrix = new Matrix(Adapter);
    var configMock = sinon.mock(matrix.configuration);
    configMock.expects('read').atLeast(2).returns({});
    configMock.expects('update').atLeast(2).returns({});

    // Act
    matrix.registerDroid(botName, token)
      .then(function() {
        return matrix.unregisterDroid(botName);
      })
      .then(function(droid) {
        // Expect
        expect(droid).to.exist;
        expect(droid.listener.disconnect.calledOnce).to.be.true;
        configMock.verify();
        return done();
      })
      .catch(function(err) {
        return done(err);
      });
  });

  it('should be able to override a droid', function(done) {
    // Arrange
    var droidSpec = require('./data/droid.json');
    var coreFunctions = require('./data/test-bot');
    var botName = droidSpec.name;
    var token = 'fake-token';
    var Matrix = require('../lib/droid-matrix');
    var Adapter = require('./adapter-mock');
    var matrix = new Matrix(Adapter);
    var configMock = sinon.mock(matrix.configuration);
    configMock.expects('read').once().returns({});
    configMock.expects('update').once().returns({});

    // Act
    matrix.registerDroid(botName, token)
      .then(function() {
        return matrix.extendDroid(droidSpec, coreFunctions);
      })
      .then(function(droid) {
        // Expect
        expect(droid).to.exist;
        var actualActions = Object.keys(droid.actions);
        expect(actualActions).not.to.be.empty;
        expect(actualActions.length).to.equal(droidSpec.actions.length);
        configMock.verify();
        return done();
      })
      .catch(function(err) {
        return done(err);
      });
  });

  it('should register a droid when installing one with a token', function(done) {
    // Arrange
    var token = 'fake-token';
    var droidSpec = require('./data/droid.json');
    var coreFunctions = require('./data/test-bot');
    var Matrix = require('../lib/droid-matrix');
    var Adapter = require('./adapter-mock');
    var matrix = new Matrix(Adapter);
    var configMock = sinon.mock(matrix.configuration);
    configMock.expects('read').once().returns({});
    configMock.expects('update').once().returns({});

    // Act
    matrix.installDroid(droidSpec, coreFunctions, token)
      .then(function(droid) {
        expect(droid).to.exist;
        var actualActions = Object.keys(droid.actions);
        expect(Object.keys(droid.actions)).to.not.be.empty;
        expect(actualActions.length).to.equal(droidSpec.actions.length);
        configMock.verify();
        return done();
      })
      .catch(function(err) {
        return done(err);
      });
  });

  it('should extend a droid using another spec', function(done) {
    // Arrange
    var token = 'fake-token';
    var droidSpec = require('./data/droid.json');
    var coreFunctions = require('./data/test-bot');
    var extendSpec = require('./data/extend.json');
    var extendFunctions = require('./data/extend-bot');
    var Matrix = require('../lib/droid-matrix');
    var Adapter = require('./adapter-mock');
    var matrix = new Matrix(Adapter);
    var configMock = sinon.mock(matrix.configuration);
    configMock.expects('read').once().returns({});
    configMock.expects('update').once().returns({});

    // Act
    matrix.installDroid(droidSpec, coreFunctions, token)
      .then(function(droid) {
        expect(droid).to.exist;
        var actualActions = Object.keys(droid.actions);
        expect(Object.keys(droid.actions)).to.not.be.empty;
        expect(actualActions.length).to.equal(droidSpec.actions.length);
        configMock.verify();
        return matrix.extendDroid(extendSpec, extendFunctions);
      })
      .then(function(droid) {
        expect(droid).to.exist;
        var actualActions = Object.keys(droid.actions);
        expect(Object.keys(droid.actions)).to.not.be.empty;
        expect(actualActions.length).to.equal(droidSpec.actions.length + extendSpec.actions.length);
        return done();
      })
      .catch(function(err) {
        return done(err);
      });
  });

  it('should not override existing actions when extending a droid', function(done) {
    // Arrange
    var token = 'fake-token';
    var droidSpec = require('./data/droid.json');
    var coreFunctions = require('./data/test-bot');
    var overrideSpec = require('./data/override-function.json');
    var overrideFunctions = require('./data/override-function-bot');
    var Matrix = require('../lib/droid-matrix');
    var Adapter = require('./adapter-mock');
    var matrix = new Matrix(Adapter);
    var configMock = sinon.mock(matrix.configuration);
    configMock.expects('read').once().returns({});
    configMock.expects('update').once().returns({});

    // Act
    matrix.installDroid(droidSpec, coreFunctions, token)
      .then(function(droid) {
        expect(droid).to.exist;
        var actualActions = Object.keys(droid.actions);
        expect(Object.keys(droid.actions)).to.not.be.empty;
        expect(actualActions.length).to.equal(droidSpec.actions.length);
        configMock.verify();
        return matrix.extendDroid(overrideSpec, overrideFunctions);
      })
      .then(function() {
        return done('Should not extend existing functions');
      })
      .catch(function(err) {
        expect(err).to.exist;
        expect(err.error).to.equal('function_override');
        return done();
      });
  });

  it('should not override existing aliases when extending a droid', function(done) {
    // Arrange
    var token = 'fake-token';
    var droidSpec = require('./data/droid.json');
    var coreFunctions = require('./data/test-bot');
    var overrideSpec = require('./data/override-alias.json');
    var overrideFunctions = require('./data/override-alias-bot');
    var Matrix = require('../lib/droid-matrix');
    var Adapter = require('./adapter-mock');
    var matrix = new Matrix(Adapter);
    var configMock = sinon.mock(matrix.configuration);
    configMock.expects('read').once().returns({});
    configMock.expects('update').once().returns({});

    // Act
    matrix.installDroid(droidSpec, coreFunctions, token)
      .then(function(droid) {
        expect(droid).to.exist;
        var actualActions = Object.keys(droid.actions);
        expect(Object.keys(droid.actions)).to.not.be.empty;
        expect(actualActions.length).to.equal(droidSpec.actions.length);
        configMock.verify();
        return matrix.extendDroid(overrideSpec, overrideFunctions);
      })
      .then(function() {
        return done('Should not extend existing aliases');
      })
      .catch(function(err) {
        expect(err).to.exist;
        expect(err.error).to.equal('alias_override');
        return done();
      });
  });

  it('should not extend a droid that is not extendable', function(done) {
    // Arrange
    var token = 'fake-token';
    var droidSpec = require('./data/not-extend.json');
    var coreFunctions = require('./data/test-bot');
    var extendSpec = require('./data/extend.json');
    var extendFunctions = require('./data/extend-bot');
    var Matrix = require('../lib/droid-matrix');
    var Adapter = require('./adapter-mock');
    var matrix = new Matrix(Adapter);
    var configMock = sinon.mock(matrix.configuration);
    configMock.expects('read').once().returns({});
    configMock.expects('update').once().returns({});

    // Act
    matrix.installDroid(droidSpec, coreFunctions, token)
      .then(function(droid) {
        expect(droid).to.exist;
        var actualActions = Object.keys(droid.actions);
        expect(Object.keys(droid.actions)).to.not.be.empty;
        expect(actualActions.length).to.equal(droidSpec.actions.length);
        configMock.verify();
        return matrix.extendDroid(extendSpec, extendFunctions);
      })
      .then(function() {
        return done('Should not be able to extend this droid');
      })
      .catch(function(err) {
        expect(err).to.exist;
        expect(err.error).to.equal('droid_not_extendable');
        return done();
      });
  });
});
