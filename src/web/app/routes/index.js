var User = require('../../../core/datalayer').User;
var no_err = require('../helpers/core').no_err;

/*
 * GET home page.
 */

exports.index = function(req, res){
  if(req.session.user_id) {
    User.findOne({id: req.session.user_id}, no_err(res, function(user) {
      if(!user) {
        res.redirect(303, 'index.html');
      } else {
        res.redirect(303, 'manage.html');
      }
    }));
  } else {
    res.redirect(303, 'index.html');
  }
};
