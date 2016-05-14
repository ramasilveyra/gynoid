var sinon = require('sinon');

module.exports = function() {
  this.ignore = sinon.spy();
  this.on = sinon.spy();
  this.start = sinon.spy();
  this.disconnect = sinon.spy();
};
