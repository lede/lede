var User = require('../../../core/datalayer').User;
var Recommendation = require('../../../core/datalayer').Recommendation;
var Notifier = require('../../../notifier/notifier.js');
var no_err = require('../helpers/core').no_err;
var crypto = require('crypto');
var log = require('../../../core/logger').getLogger("web");
var _ = require('underscore');
var util = require('util');

exports.send_daily = function(req, res) {
  Recommendation.find({user_id: req.body.id, sent: false}, no_err(res, function(recommendations) {
    Notifier.send_daily(req.body, recommendations, function() {
      _.each(recommendations, function(recommendation) {
        Recommendation.update({id: recommendation.id}, {sent: true}, function(err, res) {
          if(res) {
            log.info("Marked recommendation as sent");
          }
        });
      });
      res.send({message: "sent daily email"});
    });
  }));
};
