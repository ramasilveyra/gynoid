module.exports = {
  dm: function(req, res, next) {
    if (req.channel.type === 'dm') {
      return next();
    }

    return res.text('I can only reply direct messages').send();
  },
  channels: function(req, res, next) {
    console.log('channels check');
    return next();
  }
};
