var User = require('../core/datalayer').User;
var _ = require('underscore');
var dataLayer = require('../core/datalayer');
var notifier = require('../notifier/notifier');
var util = require('util');
var Step = require('step');

function sendDailyEmails(done) {
	// Get all users
  log.info('Starting email generation process for all users...');

  dataLayer.User.find({}, { only: ['id', 'email'] }, function(err, users) {
    if(err) {
      log.error('Error getting user ids: ' + err);
      done(err);
    } else {
      log.debug('Got result from user id lookup, found : ' + util.inspect(users));
      Step(
        function () {
          var group = this.group();

          _.each(
            users,
            function (user) { 
              sendDailyEmailForUser(user, group());
            }
          );
        },
        done
      );
    }
  });
} 

/** send an email for one user
 * @param user  the user object to send to.  must contain attributes for 'id' and 'email'
 * @param done  the callback.  there is no results param, only error
 */
function sendDailyEmailForUser(user, done) {
  fetchLedesForUser(user.id, settings.recommender.numberOfLedes, function(err, ledes) {
    if(err) {
      log.error('Error finding Ledes for user ' + user.id + ' : ' + err);
      done(err);
    } else {
      log.info('Sending email to user ' + user.id + ' (' + user.email + ') with ' + ledes.length + ' links');
      notifier.send_daily(user, ledes, done);
    }
  });
}

/** fetches Ledes for the specified user, up to a max of 'limit'.  Will fetch the oldest ones first
 * @param userId the user to fetch for
 * @param limit  the max number of Ledes to fetch
 * @done  callback.  result is array of Ledes
 */
function fetchLedesForUser(userId, limit, done) {
  log.debug('Fetching ledes for user: ' + userId);
  dataLayer.Recommendation.find({ user_id: userId, sent: false }, { order: ['created_at'], limit: limit }, done);
}

exports.sendDailyEmails = sendDailyEmails;
exports.sendDailyEmailForUser = sendDailyEmailForUser;
