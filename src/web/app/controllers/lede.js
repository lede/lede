var Lede = require('../../../core/datalayer').Lede;
var Post = require('../../../core/datalayer').Post;
var _ = require('underscore');
var util = require('util');
var no_err = require('../helpers/core.js').no_err;

exports.create = function(req, res) {
  
  // clean this up, but:
  // ensure we have a valid request
  if(!req.body.lede_url || !req.body.lede_title) {
    // invalid request, say so:
    res.send({ result: 'Failed', message: 'Not all required request fields were present.', original_request: req.body });
    return;
  }
  
  // Try to find a post already in the db for this lede..
  Post.findOne({uri: req.body.lede_url}, no_err(res, function(post) {

    // did we find one?
    if(!post) {
      // nope, we didn't. Create one now.
      Post.create({ title: req.body.lede_title, uri: req.body.lede_url }, no_err(res, function(created_posts) {

        // create a Lede that points at the post we just created or found
        Lede.create({ post_id: created_posts.rows[0].id }, no_err(res, function(results) {

          // let the client know we're done here.
          console.log('Created a new Lede with ID: ' + created_posts.rows[0].id);
          res.send({ result: 'Created' });

        }));

      }));
    } else {

      console.log(util.inspect(post));

      // create a Lede that points at the post we either created or found
      Lede.create({ post_id: post.id }, no_err(res, function(results) {

        // let the client know we're done here.
        console.log('Created a new Lede with ID: ' + results.rows[0].id);
        res.send({ result: 'Created' });
      }));
    }

  }));

};
