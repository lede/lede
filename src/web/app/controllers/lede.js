var Lede = require('../../../core/datalayer').Lede;
var Post = require('../../../core/datalayer').Post;
var _ = require('underscore');
var util = require('util');
var no_err = require('../helpers/core').no_err;

exports.create = function(req, res) {
  
  // clean this up, but:
  // ensure we have a valid request
  if(!req.body.target || !req.body.title) {
    // invalid request, say so:
    res.send({ result: 'Failed', message: 'Not all required request fields were present.', original_request: req.body });
    return;
  }
  
  // create a Lede that points at the post we either created or found
  Lede.create({ post_id: post.id }, no_err(res, function(results) {

    // let the client know we're done here.
    console.log('Created a new Lede with ID: ' + results.rows[0].id);
    res.send({ result: 'Created' });

  }));

};
