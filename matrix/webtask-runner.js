var request = require('request');

module.exports = function(url, req, res, next) {
  var options = {
    url: url,
    qs: req.params
  };

  request(options, function(err, data) {
    if (err) {
      return res.text('An error has occurred: ' + JSON.stringify(err)).send();
    }

    var body = JSON.parse(data.body);
    res.text('```' + JSON.stringify(body, null, 2) + '```').send();
  });
};
