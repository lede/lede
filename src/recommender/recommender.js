settings = require('../core/settings').get("recommender");
log = require('../core/logger').getLogger("recommender");
var User = require('../core/datalayer').User;
var _ = require('underscore');
var dataLayer = require('../core/datalayer');
var notifier = require('../notifier/notifier');
var util = require('util');
var Step = require('step');

function generateDailyEmails(numberOfLedes, done) {
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
              var cb = group();

              fetchLedesForUser(user.id, numberOfLedes, function(err, ledes) {
                if(err) {
                  log.error('Error finding Ledes for user ' + user.id + ' : ' + err);
                  cb(err);
                } else {
                  log.info('Sending email to user ' + user.id + ' (' + user.email + ') with ' + ledes.length + ' links');
                  notifier.send_daily(user, ledes, cb);
                }
              });
            }
          );
        },
        done
      );
    }
  });
} 

function fetchLedesForUser(userId, limit, done) {
  log.debug('Fetching ledes for user: ' + userId);
  dataLayer.Recommendation.find({ user_id: userId, sent: false }, { order: ['created_at'], limit: limit }, done);
}

// Handle top-level exceptions
process.on('uncaughtException',function(error) {
  log.fatal('Top-Level Uncaught Exception: ' + error);
  log.fatal(error.stack);
  log.fatal('Exiting in 10 seconds...');
  setTimeout(function() {
    log.fatal('Exiting.');
    process.exit(1);
  }, 10000);
});

var NUMBER_OF_POSTS_PER_EMAIL = 3; // HACK: get from settings

generateDailyEmails(NUMBER_OF_POSTS_PER_EMAIL, function() { 
  log.info('Done sending daily emails!');
  process.exit(0); 
});
