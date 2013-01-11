var Notification = require('../../../core/datalayer').Notification;
var no_err = require('../helpers/core').no_err;
var log = require('../../../core/logger').getLogger("web");
var util = require('util');

exports.list = function(req, res) {
  Notification.find(req.query, no_err(res, function(notifications) {
    if(notifications) {
      res.send(notifications);
    } else {
      res.status(404);
      res.send({error: "no notifications found"});
    }
  }));
};


exports.create = function(req, res) {
  Notification.create(req.body, function(err, notifications) {
    if (err) {
      res.status(400);
      res.send({error: "Error creating notification"});
    } else {
      res.send(notifications.rows[0]);
    }
  });
};
