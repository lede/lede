var Notification = require('../../../core/datalayer').Notification;
var Recommendation = require('../../../core/datalayer').Recommendation;
var log = require('../../../core/logger').getLogger('web');
var _ = require('underscore');
var util = require('util');
var no_err = require('../helpers/core').no_err;
var path = require('path');
var queues = require('../../../core/resque-queues');
var query = require('./query');

// Handles the POST request callback from the email service provider (SendGrid in this case)
// and updates the notification or link accordingly
// The post body will take this form:
//   email=emailrecipient@domain.com&event=open&userid=1123&template=welcome
exports.process = function(req, res) {

  log.info(req.body);

  var triggering_event = req.body.event;
  var notification_id = req.body.notification_id;

  log.info('Triggering event: ' + triggering_event);
  log.info('Notification ID: ' + notification_id);

  if (triggering_event == 'delivered') {
    Notification.update(
      { id: notification_id },
      { delivered_at: new Date() },
      log_any_errors
    );
  } else if (triggering_event == 'opened') {
    Notification.update(
      { id: notification_id },
      { opened_at: new Date() },
      log_any_errors
    );
  } else if (triggering_event == 'click') {
    var link_url = req.body.url;
    Recommendation.update(
      { uri: link_url },
      { clicked_at: new Date() },
      log_any_errors
    );
  }

  // Respond right away since SendGrid isn't waiting for us anyhow.
  res.status = 200;
  res.end();
};

function log_any_errors(err, result) {
  if (err) {
    log.error(err);
  } else if ( result) {
    log.info('Result ' + result);
  }
}
