function directMessageCheck(req, acls) {
  if (!acls.hasOwnProperty('dm')) {
    // By default, if not specified, we don't accept direct messages
    return false;
  }

  return (acls.dm && req.channel.type === 'dm') || (!acls.dm && req.channel.type !== 'dm');
}

function channelsCheck(req, acls) {
  if (!acls.hasOwnProperty('channels')) {
    return false;
  }

  return acls.channels && acls.channels.indexOf(req.channel.name) >= 0;
}

function mentionCheck(req, acls) {
  if (!acls.hasOwnProperty('mention')) {
    return false;
  }

  return (acls.mention && (req.message.value.mentioned || req.channel.type === 'dm') ) || (!acls.mention && !req.message.value.mentioned);
}

module.exports = function checkAccess(acls) {
  return function(req, res, next) {
    var directMessage = directMessageCheck(req, acls);
    var channel = channelsCheck(req, acls);
    var mention = mentionCheck(req, acls);

    console.log('ACLS:', directMessage, channel, mention);

    if (directMessage || channel || mention) {
      return next();
    }
  };
};
