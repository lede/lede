var User = require('../../../core/datalayer').User;
var Apikey = require('../../../core/datalayer').Apikey;
var no_err = require('../helpers/core').no_err;
var log = require('../../../core/logger').getLogger("web");
var util = require('util');


exports.ensure_user = function (req, res, next) {
  log.info('Verifying user is authenticated');

  // If we have a session, see if it's valid
  if(req.session.user_id) {
    User.findOne({id: req.session.user_id}, no_err(res, function(user) {
      if(!user) {
        log.info('Invalid session');
        res.status(403); // forbidden
        res.send({ error: 'Invalid session, please log in again'});
      } else {
        req.user = user;
        next();
      }
    }));
  // If we don't have a session, we might have an API key. Check that out.
  } else if (req.body.apikey) {
    Apikey.findOne({apikey: req.body.apikey}, no_err(res, function(apikey) {
      if(!apikey) {
        log.info('Invalid api key');
        res.status(403); // forbidden
        res.send({ error: 'Invalid api key, please retry your request'});
      } else {
        User.findOne({id: apikey.user_id}, no_err(res, function(user) {
          if(!user) {
            log.info('Valid API Key, but its user does not exist');
            res.status(403); // forbidden
            res.send({ error: 'User does not exist, please retry your request'});
          } else {
            req.user = user;
            next();
          }
        }));
      }
    }));
  // Someone fucked up
  } else {
    log.info('A non-logged in session attempted to access a users-only endpoint');
    res.status(403); // forbidden
    res.send({ error: 'Valid session required, please log in'});
  }
};
