var sinon = require('sinon');

var listenStub = sinon.stub();
listenStub.withArgs(sinon.match.string, sinon.match.any).returns({ id: 'test-id'});

module.exports = function() {
  this.ignore = sinon.spy();
  this.on = sinon.spy();
  this.start = sinon.spy();
  this.disconnect = sinon.spy();
  this.listen = listenStub;
};
