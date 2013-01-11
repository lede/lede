var Recommendation = require('../../../core/datalayer').Recommendation;
var no_err = require('../helpers/core').no_err;
var log = require('../../../core/logger').getLogger("web");
var util = require('util');

exports.list = function(req, res) {
  Recommendation.find(req.query, no_err(res, function(recommendations) {
    if(recommendations) {
      res.send(recommendations);
    } else {
      res.status(404);
      res.send({error: "no recommendations found"});
    }
  }));
};


exports.create = function(req, res) {
  Recommendation.create(req.body, function(err, recommendations) {
    if (err) {
      res.status(400);
      res.send({error: "Error creating recommendation"});
    } else {
      res.send(recommendations.rows[0]);
    }
  });
};
