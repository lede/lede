var Story = require('../../../core/datalayer').Story;
var Recommender = require('../../../recommender/recommender.js');
var no_err = require('../helpers/core').no_err;
var log = require('../../../core/logger').getLogger("web");
var util = require('util');
var query = require('./query.js');

exports.list = function(req, res) {
  var tq = query.translate(req.query);
  Story.find(tq.select, tq.attributes, no_err(res, function(stories) {
    if(stories) {
      res.send(stories);
    } else {
      res.status(404);
      res.send({error: "no stories found"});
    }
  }));
};

exports.create = function(req, res) {
  Story.create(req.body, function(err, stories) {
    if(err) {
      res.status(400);
      res.send({error: "Error creating story"});
    } else {
      res.send(stories.rows[0]);
    }
  });
};

exports.update = function(req, res) {
  Story.update({id: req.route.params.story_id}, req.body, function(err, stories) {
    if(err) {
      res.status(400);
      res.send({error: "Error updating story"});
    } else {
      res.send({result: stories + " story/stories updated"});
    }
  });
};

exports.remove = function(req, res) {
  Story.destroy({id: req.route.params.story_id}, function(err, rows) {
    if(err) {
      res.status(500);
      res.send({error: "Error deleting story"});
    } else {
      res.send({result: rows + " story/stories deleted"});
    }
  });
};
