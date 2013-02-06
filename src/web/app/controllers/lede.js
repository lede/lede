var Lede = require('../../../core/datalayer').Lede;
var Post = require('../../../core/datalayer').Post;
var _ = require('underscore');
var util = require('util');
var no_err = require('../helpers/core').no_err;
var path = require('path');
var queues = require('../../../core/resque-queues');
var query = require('./query');
var url = require('url');
var User = require('../../../core/datalayer').User;

exports.create = function(req, res) {

  if(req.session.user_id) {
    User.findOne({id: req.session.user_id}, no_err(res, function(user) {
      if(!user) {
        log.info('Invalid session');
        res.send("var response = { success: false, message: 'Please log in.' };");
        return;
      } else {
        req.user = user;
      }
    }));
  } else {
    log.info('A non-logged in session attempted to Lede a page');
    res.send("var response = { success: false, message: 'Please log in.' };");
  }

  // clean this up, but:
  // ensure we have a valid request
  if(!req.query.target) {
    // invalid request, say so:
    log.warn('Malformed bookmarklet request: ' + util.inspect(req.query));
    res.send("var response = { success: false, message: 'Not all required request fields were present.' };");
    return;
  }

  log.info('Bookmarklet request looks ok, processing...');

  // don't pass parent id since there's no meaning to it here and discoverer seems to ignore it anyway
  queues.fastDiscover.enqueue({ parentId: null, url: req.query.target});
  
  // create a Lede that points at the post we either created or found
  Lede.create({ uri: req.query.target, title: req.query.title, user_id: req.user.id }, no_err(res, function(results) {

    // let the client know we're done here.
    log.info('Created a new Lede with ID: ' + results.rows[0].id);
    res.send("var response = { success: true };");

  }));

};

exports.list = function(req, res) {
  var tq = query.translate(req.query);
  Lede.find(tq.select, tq.attributes, no_err(res, function(results) {
    log.info("Listed Ledes for user " + req.user.id);
    res.send(results);
  }));

};
