function directMessageCheck(req, acls) {
  if (!acls.hasOwnProperty('dm')) {
    // By default, if not specified, we accept direct messages
    return true;
  }

  return (acls.dm && req.channel.type === 'dm') || (!acls.dm && req.channel.type !== 'dm');
}

function channelsCheck(req, acls) {
  if (!acls.hasOwnProperty('channels')) {
    return true;
  }

  return acls.channels && acls.channels.indexOf(req.channel.name) >= 0;
}

function mentionCheck(req, acls) {
  if (!acls.hasOwnProperty('mention')) {
    return true;
  }

  return (acls.mention && (req.message.value.mentioned || req.channel.type === 'dm') ) || (!acls.mention && !req.message.value.mentioned);
}

function explicitMentionCheck(req, acls) {
  if (!acls.hasOwnProperty('explicitMention')) {
    return true;
  }

  return (acls.explicitMention && (req.message.value.explicitMention || req.channel.type === 'dm') ) || (!acls.explicitMention && !req.message.value.explicitMention);
}

module.exports = function checkAccess(acls) {
  return function(req, res, next) {
    var directMessage = directMessageCheck(req, acls);
    var channel = channelsCheck(req, acls);
    var mention = mentionCheck(req, acls);
    var explicitMention = explicitMentionCheck(req, acls);

    if (directMessage && channel && mention && explicitMention) {
      return next();
    }
  };
};
