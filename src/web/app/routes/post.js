var Post = require("../../../core/datalayer").Post;
var _ = require("underscore");
var no_err = require('../helpers/core').no_err;

exports.get = function(req, res) {
  if(req.route.params.id) {
    Post.findOne({id: req.route.params.id}, no_err(res, function(post) {
      if(!post) {
        res.status = 404;
        res.send({ result: 'Specified post does not exist' });
      } else {
        res.send(post);
      }
    }));
  } else {
    res.status = 500;
    res.end({ result: 'Please specify a post from which to check links.' });
  }
};
