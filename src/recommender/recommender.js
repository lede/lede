settings = require('../core/settings').get("recommender");
log = require('../core/logger').getLogger("recommender");
ledefactor = require(ledefactor);
var dataLayer = require('../core/datalayer');
var _ = require('underscore');

function generateDailyEmails(numberOfLedes) {
	// Get all users

	// For each unique user:
	// <async> fetchLedesForUser (callback: fetchLedesforUser)

} 

function fetchLedesForUser(user, resolveLedesCallback) {
  // For the given user, get all the ledes from the database (callback: resolveLedesToPosts)
}

function resolveLedesToPosts(ledes, getTopRelatedPosts) {
  // 
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

