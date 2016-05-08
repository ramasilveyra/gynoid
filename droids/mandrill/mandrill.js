module.exports = {
  getSeries: function(req, res) {
    console.log('Getting series');
    var mandrill = require('mandrill-api/mandrill');
    var moment = require('moment');
    console.log(process.env.MANDRILL_KEY);
    var client = new mandrill.Mandrill(process.env.MANDRILL_KEY);
    var fromDate = moment().utc().startOf('day').format();
    var toDate = moment().utc().endOf('day').format();

    // var email = req.params.email;
    var email = 'verlic@live.com';
    var searchQuery = {'query': 'full_email:' + email, 'date_from': fromDate, 'date_to': toDate};

    console.log('Trying!');

    client.messages.searchTimeSeries(searchQuery, function(result) {
      result = result.map(function(group) {
        return {
          time: group.time,
          sent: group.sent,
          hard_bounces: group.hard_bounces,
          soft_bounces: group.soft_bounces,
          rejects: group.rejects
        };
      });

      console.log('found!', JSON.stringify(result, null, 2));
      var responseText = 'Messages grouped by hour for `' + email + '`\n```\n' + JSON.stringify(result, null, 2) + '\n```';
      return res.text(responseText).send();
      }, function(err) {
        console.log('error!');
        return res.text('Could not reach Mandrill. Error:\n ```\n' + err + '\n```').send();
      });
  }
};
