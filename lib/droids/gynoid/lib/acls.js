module.exports = function checkAccess(acls) {
  return function(req, res, next) {
    if (acls.dm && req.channel.type === 'dm') {
      return next();
    }

    if (acls.hasOwnProperty('dm') && !acls.dm && req.channel.type === 'dm') {
      return res.text('I can\'t execute this action as a direct message').send();
    }

    if (acls.channels && acls.channels.indexOf(req.channel.name) >= 0) {
      return next();
    }

    return res.text('I can\'t reply to this action in this channel.').send();
  };
};
