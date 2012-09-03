var User = require('../../../core/datalayer').User;
var no_err = require('../helpers/core').no_err;
var log = require('../../../core/logger').getLogger("web")


function ensure_user(req, res, next) {
  log.info('Verifying user is authenticated');
  if(req.session.user_id) {
    User.findOne({id: req.session.user_id}, no_err(res, function(user) {
      if(!user) {
        res.status = 500;
        res.send({ result: 'Invalid user id specified'});
      } else {
        req.session.user = user;
        next();
      }
    }));
  } else {
    log.info('A non-logged in session attempted to access a users-only endpoint');
    res.status = 500;
    res.send({ result: 'User id is required but was not specified'});
  }
}
