var dataLayer = require('../../../core/datalayer');
var no_err = require('../helpers/core').no_err;
var crypto = require('crypto');
var notifier = require('../../../notifier/notifier.js');
var log = require('../../../core/logger').getLogger("web");
var util = require('util');
var uuid = require('node-uuid');
var query = require('./query.js');

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
  var tq = query.translate(req.query);
  dataLayer.User.find(tq.select, tq.attributes, no_err(res, function(users) {
    res.send(users);
  }));
};

exports.findOne = function(req, res) {
  dataLayer.User.findOne({id: req.route.params.user_id}, function(err, user) {
    if(err) {
      res.status(404);
      res.send({error: 'dataLayer.User with this id not found'});
    } else if (user) {
      res.send(user);
    }
  });
};

exports.login = function(req, res) {
  // yell if we don't have both username and password 422 Unprocessable Entity
  if(req.body.user_email && req.body.user_password) {

    // lc the email address for consistency!
    var email_address = req.body.user_email.toLowerCase();

    // hash the provided password
    var sha_sum = crypto.createHash('sha1');
    sha_sum.update(req.body.user_password);
    var password_hash = sha_sum.digest('hex');
    
    // See if the user-password combination is valid
    dataLayer.User.findOne({
      email: email_address, 
      password_hash: password_hash
    }, 
    no_err(res, function(user) {
      if(!user) {
        res.status(403); // forbidden
        res.send({ error: 'Invalid username or password' });
      } else {
        req.session.user_id = user.id;
        req.session.cookie.maxAge = 5184000000; //60 days
        res.send({ result: 'Logged in as: ' + user.email });
      }
    }));
  } else {
    res.status(422); // unprocessable entity
    res.send({ error: 'username and password are required fields but both were not specified' });
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

exports.register = function(req, res) {

  // Email param is required
  if(req.body.user_email) {

    var email_address = req.body.user_email.toLowerCase();

    // Validate email
    // FIXME: this should probably go in a model validation, but we don't have those (yet)
    // NOTE: validating emails according to the RFC with a regex is basically impossible,
    // but this should handle all sane addresses, which is good enough for now.
    var email_validator = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/i;
    if(!email_validator.test(email_address)) {
      res.status(400); // bad request
      res.send({ error: 'That email looks invalid!' });
      return;
    }

    // Ensure we don't already have a user with that email
    dataLayer.User.findOne({email: email_address}, no_err(res, function(user) {

      // Duplicate user, yell
      if(user) {
        res.status(409); // Conflict
        res.send({ error: 'An account with that email already exists!' });
      } else {
        // Is the user allowed to create an account?
        dataLayer.CollectedEmailAddress.findOne({email: email_address}, no_err(res, function(collectedEmailAddress) {
          if(collectedEmailAddress && collectedEmailAddress.can_create_account_as_of) {
            // Create the new user
            password = randomPass(); // HACK: send random password to user in email
            sha_sum = crypto.createHash('sha1');
            sha_sum.update(password);
            dataLayer.User.create({
              email: email_address,
              password_hash: sha_sum.digest('hex')
            },
            no_err(res, function(created_users) {
              var apikey = uuid.v4();
              dataLayer.Apikey.create({
                user_id: created_users.rows[0].id,
                apikey: apikey
              },
              no_err(res, function(created_apikeys) {
                req.session.user_id = created_users.rows[0].id;
                log.info('Logging in as new user: ' + util.inspect(created_users.rows[0]));
                notifier.send_welcome(created_users.rows[0].id, password, function() {
                  log.info('Sent welcome email for ' + created_users.rows[0].id);
                });
                res.send({ success: true, apikey: apikey, result: 'Account created for ' + email_address });
              }));
            }));
          } else {
            log.info("Collected email address for " + email_address);
            // We aren't ready for this user yet, but let's take their email address if we don't already have it
            if(!collectedEmailAddress) {
              dataLayer.CollectedEmailAddress.create({
                email: email_address
              }, function(err, result) {
                if (err) {
                  log.error("While creating collected email address: " + err.stack);
                }
              });
            }

            res.status(200);
            res.send({ success: true, waitlisted: true, result: 'User added to waitlist' });
          }
        }));
      }
    }));
  } else {

    // Yell about missing required email param
    res.status(422); // Unprocessable entity
    res.send({ error: 'An email must be specified to register an account' });
  }
};

exports.apikey = function(req, res) {
  dataLayer.Apikey.create({
    user_id: req.session.user_id,
    apikey: uuid.v4()
  },
  no_err( res, function(created_apikeys) {
    log.info('Generating new API key for user: ' + util.inspect(req.session.user_id));
    res.send({ result: created_apikeys.rows[0].apikey });
  }));
};
