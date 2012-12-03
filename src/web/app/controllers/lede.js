var Lede = require('../../../core/datalayer').Lede;
var Post = require('../../../core/datalayer').Post;
var _ = require('underscore');
var util = require('util');
var no_err = require('../helpers/core').no_err;
var path = require('path');
var queues = require('../../../core/resque-queues');



exports.create = function(req, res) {

  // clean this up, but:
  // ensure we have a valid request
  if(!req.query.target) {
    // invalid request, say so:
    log.warn('Malformed bookmarklet request: ' + util.inspect(req.query));
    res.status(422); // unprocessable entity
    res.send({ result: 'Failed', message: 'Not all required request fields were present.', original_request: req.query });
    return;
  }

  log.info('Bookmarklet request looks ok, processing...');

  // don't pass parent id since there's no meaning to it here and discoverer seems to ignore it anyway
  queues.fastDiscover.enqueue({ parentId: null, url: req.query.target});
  
  // create a Lede that points at the post we either created or found
  Lede.create({ uri: req.query.target, title: req.query.title, user_id: req.body.user.id }, no_err(res, function(results) {

    // let the client know we're done here.
    log.info('Created a new Lede with ID: ' + results.rows[0].id);
    var response_pixel_path = path.resolve('public/images/response_pixel.gif');
    res.sendfile(response_pixel_path);

  }));

};

exports.list = function(req, res) {

  // create a Lede that points at the post we either created or found
  Lede.find({ user_id: req.body.user.id }, no_err(res, function(results) {
    log.info("Listed Ledes for user " + req.body.user.id);
    res.send({ ledes: results });
  }));

};
