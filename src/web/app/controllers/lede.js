var Lede = require('../../../core/datalayer').Lede;
var Post = require('../../../core/datalayer').Post;
var _ = require('underscore');
var util = require('util');
var no_err = require('../helpers/core').no_err;


exports.create = function(req, res) {

  // clean this up, but:
  // ensure we have a valid request
  if(!req.query.target) {
    // invalid request, say so:
    log.warn('Malformed bookmarklet request: ' + util.inspect(req.query));
    res.status(500);
    res.send({ result: 'Failed', message: 'Not all required request fields were present.', original_request: req.query });
    return;
  }

  log.info('Bookmarklet request looks ok, processing...');

  
  // create a Lede that points at the post we either created or found
  Lede.create({ uri: req.query.target, user_id: req.body.user.id }, no_err(res, function(results) {

    // let the client know we're done here.
    log.info('Created a new Lede with ID: ' + results.rows[0].id);
    res.sendfile('../public/images/response_pixel.gif');

  }));

};
