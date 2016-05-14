module.exports = {
  dm: function(accepts) {
    return function(req, res, next) {
      if ((accepts && req.channel.type === 'dm') || (!accepts && req.channel.type !== 'dm')) {
        console.log('OK!', accepts);
        return next();
      } else if (accepts) {
        return res.text('I can only reply to direct messages').send();
      } else {
        return res.text('I can\'t execute this action as a direct message').send();
      }
    };
  },
  channels: function(channels) {
    return function(req, res, next) {
      if (channels.indexOf(req.channel.name) >= 0) {
        return next();
      }

      return res.text('I can\'t reply this action in this channel.').send();
    };
  }
};
