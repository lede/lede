var User = require('../../../core/datalayer').User;
var no_err = require('../helpers/core').no_err;
var crypto = require('crypto');
var notifier = require('../../../notifier/notifier.js');
var log = require('../../../core/logger').getLogger("web");
var util = require('util');

// HACK: break this out into some util library
function randomPass() {
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  var string_length = 8;
  var random_string = '';
  for (var i = 0; i < string_length; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      random_string += chars.substring(rnum, rnum + 1);
  }
  return random_string;
}

exports.findAll = function(req, res) {
  User.find({}, no_err(res, function(users) {
    res.send(users);
  }));
};

exports.findOne = function(req, res) {
  User.findOne({id: req.route.params.user_id}, function(err, user) {
    if(err) {
      res.status(404);
      res.send({error: 'User with this id not found'});
    } else if (user) {
      res.send(user);
    }
  });
};

// FIXME: currently insecure login, will let you access any account with a username
// just for testing
exports.login = function(req, res) {
  if(req.body.user_email) {
    User.findOne({email: req.body.user_email}, no_err(res, function(user) {
      if(!user) {
        res.status(403); // forbidden
        res.send({ error: 'Invalid username or password' });
      } else {
        req.session.user_id = user.id;
        res.send({ error: 'Logged in as: ' + user.email });
      }
    }));
  } else {
    res.status(422); // unprocessable entity
    res.send({ error: 'User name is required but was not specified' });
  }
};

exports.logout = function(req, res) {
  if(req.session) {
    req.session.destroy(function() {});
    res.send({ result: 'Logged Out' });
  }
};

// sanity check endpoint, likely just for testing
// sends back the current active user email
// NOTE: we don't need to check for req.session.user because this should
// always be behind an ensure_user middleware filter
exports.whoami = function(req, res) {
  res.send({ result: req.user });
};

// FIXME: hacked up registration that doesn't take or create a password
// just for testing
exports.register = function(req, res) {

  // email param is required
  if(req.body.user_email) {

    // ensure we don't already have a user with that email
    User.findOne({email:  req.body.user_email}, no_err(res, function(user) {

      // duplicate user, yell
      if(user) {
        res.status(409); // conflict
        res.send({ error: 'An account with that email already exists!' });
      } else {

        // create the new userult"
        password = randomPass(); // HACK: send random password to user in email
        sha_sum = crypto.createHash('sha1');
        sha_sum.update(password);
        User.create({ email: req.body.user_email, password_hash: sha_sum.digest('hex')  }, no_err(res, function(created_users) {
          req.session.user_id = created_users.rows[0].id;
          log.info('Logging in as new user: ' + util.inspect(created_users.rows[0]));
          notifier.send_welcome(created_users.rows[0].id, password, function() {
            log.info('Sent welcome email for ' + created_users.rows[0].id);
          });
          res.send({ result: 'User created for ' + req.body.user_email });
        }));
      }
    }));
  } else {

    // yell about missing required email param
    res.status(422); // unprocessable entity
    res.send({ error: 'An email must be specified to register an account' });
  }
};
