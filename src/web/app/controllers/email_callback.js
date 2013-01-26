var Notification = require('../../../core/datalayer').Notification;
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

  var triggering_event = req.body.event;
  var notification_id = req.body.notification_id;

  // if (event is click)
  //  var link = req.body.url

  Notification.update();
};
