settings = require('../core/settings').get("recommender");
log = require('../core/logger').getLogger("recommender");
var User = require('../core/datalayer').User;
var _ = require('underscore');
var orm = require('../core/datalayer').client;
var notifier = require('../notifier/notifier');
var util = require('util');

function backlinksQuery(userId, limit) {
  return "SELECT posts.id FROM posts JOIN links ON links.from_post_id = posts.id JOIN ledes ON lower(links.uri) = lower(ledes.uri) WHERE ledes.user_id = " + userId + " AND (links.created_at > now() - interval '1 day') ORDER BY links.created_at DESC LIMIT " + limit;
}

function generateDailyEmails(numberOfLedes, done) {
	// Get all users
  log.info('Starting email generation process for all users...');

  orm.emit("query", "SELECT id FROM users", function(err, result) {
    if(err) {
      log.error('Error getting user ids: ' + err);
    } else {
      log.info('Got result from user id lookup, found : ' + util.inspect(result.rows));
      // HACK: use step or something similar here - also note this wouldn't be necessary at all if we weren't getting magically daemonized by some unseen evil in the settings stuff
      var outstanding = result.rows.length;
      _.each(
        _.pluck(result.rows, 'id'),
        function(userId) { 
          fetchLedesForUser(userId, numberOfLedes, function() {
            log.info('Completed ledes for ' + userId);
            outstanding--;
            if(outstanding === 0) {
              done();
            }
          });
        }
      );
      if(outstanding === 0) { done(); }
    }
  });
} 

function fetchLedesForUser(userId, limit, done) {

  log.info('Fetching ledes for user: ' + userId);

  orm.emit('query', backlinksQuery(userId, limit), function(err, result) {
    if(err) {
      log.error('Error finding backlinks for user: ' + userId + ' : ' + err);
      done();
    } else {
      log.info('Sending email to ' + userId + ' with : ' + result.rows.length + ' links');
      notifier.send_daily(userId, _.pluck(result.rows, 'id'), done);
    }
  });
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
