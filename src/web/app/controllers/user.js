var User = require('../../../core/datalayer').User;
var no_err = require('../helpers/core').no_err;

// FIXME: currently insecure login, will let you access any account with a username
// just for testing
exports.login = function(req, res) {
  if(req.body.user_email) {
    User.findOne({email: req.body.user_email}, no_err(res, function(user) {
      if(!user) {
        res.status = 500;
        res.send({ result: 'Specified username does not exist' });
      } else {
        req.session.user_id = user.id;
        res.send({ result: 'Loggen in as: ' + req.body.user_email });
      }
    }));
  } else {
    res.status = 500;
    res.send({ result: 'User name is required but was not specified' });
  }
}

exports.logout = function(req, res) {
  if(req.session) {
    req.session.destroy(function() {});
    res.send({ result: 'Logged Out' });
  }
}

// sanity check endpoint, likely just for testing
// sends back the current active user email
// NOTE: we don't need to check for req.session.user because this should
// always be behind an ensure_user middleware filter
exports.whoami = function(req, res) {
  res.send({ result: req.session.user.email });
}

// FIXME: hacked up registration that doesn't take or create a password
// just for testing
exports.register = function(req, res) {

  // email param is required
  if(req.body.user_email) {

    // ensure we don't already have a user with that email
    User.findOne({email:  req.body.user_email}, no_err(res, function(user) {

      // duplicate user, yell
      if(user) {
        res.status = 500;
        res.send({ result: 'Specified user email already exists, not re-registering.' });
      } else {

        // create the new user
        User.create({ email: req.body.user_email }, no_err(res, function(created_users) {
          res.send({ result: 'User created for ' + req.body.user_email });
        }));
      }
    }));
  } else {

    // yell about missing required email param
    res.status = 500;
    res.send({ result: 'An email must be specified to register an account' });
  }
}






