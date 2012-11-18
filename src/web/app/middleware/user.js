var User = require('../../../core/datalayer').User;
var no_err = require('../helpers/core').no_err;
var log = require('../../../core/logger').getLogger("web");
var util = require('util');


exports.ensure_user = function (req, res, next) {
  log.info('Verifying user is authenticated');

  if(req.session.user_id) {
    User.findOne({id: req.session.user_id}, no_err(res, function(user) {
      if(!user) {
        res.status(401); // not authenticated
        res.send({ error: 'Invalid user id specified'});
      } else {
        req.body.user = user;
        next();
      }
    }));
  } else {
    log.info('A non-logged in session attempted to access a users-only endpoint');
    res.status(401); // not authenticated
    res.send({ error: 'User id is required but was not specified'});
  }
}
