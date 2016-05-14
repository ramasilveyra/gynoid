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
        expect(droid).to.exist;
        expect(droid.listener.disconnect.calledOnce).to.be.true;
        configMock.verify();
        return done();
      })
      .catch(function(err) {
        return done(err);
      });
  });
});
