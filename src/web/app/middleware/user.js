var User = require('../../../core/datalayer').User;
var no_err = require('../helpers/core.js').no_err;

function ensure_user(req, res, next) {
  if(req.session.user_id) {
    User.findOne({id: req.session.user_id}, no_err(res, function(user) {
      if(!user) {
        res.redirect('/user/login');
      } else {
        req.session.user = user;
        next();
      }
    }));
  } else {
    res.redirect('/user/login');
  }
}
