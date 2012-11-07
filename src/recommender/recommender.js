settings = require('../core/settings').get("recommender");
log = require('../core/logger').getLogger("recommender");
var User = require('../core/datalayer').User;
var _ = require('underscore');
var orm = require('../core/datalayer').client;
var notifier = require('../notifier/notifier');
var util = require('util');

function backlinksQuery(userId, limit) {
  return "SELECT posts.id FROM posts JOIN links ON links.from_post_id = posts.id JOIN ledes ON links.uri = ledes.uri WHERE ledes.user_id = " + parseInt(userId) + " AND links.created_at > now() - interval '1 day' ORDER BY links.created_at DESC LIMIT " + parseInt(limit);
}

function generateDailyEmails(numberOfLedes) {
	// Get all users
  log.info('Starting email generation process for all users...');

  orm.emit("query", "SELECT id FROM users", function(err, result) {
    if(err) {
      log.error('Error getting user ids: ' + err);
    } else {
      log.info('Got result from user id lookup, found : ' + util.inspect(result.rows));
      _.each(
        _.map(result.row, function(row) { return row['id']; }),
        function(userId) { 
          log.info('Fetching ledes for user: ' + userId);
          fetchLedesForUser(userId, numberOfLedes); 
        }
      );
      log.info('Done sending daily emails!');
    }
  });
} 

function fetchLedesForUser(userId, limit) {

  log.info('Fetching ledes for user: ' + userId);

  orm.emit('query', backLinksQuery(userId, limit), function(err, result) {
    if(err) {
      log.error('Error finding backlinks for user: ' + userId + ' : ' + err);
    } else {
      log.info('Sending email to ' + userId + ' with : ' + result.rows.length + ' links');
      notifier.send_daily(userId, _.map(result.rows, function(row) { return row['id']; }));
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

generateDailyEmails(settings.numberOfPosts);
