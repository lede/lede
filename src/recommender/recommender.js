settings = require('../core/settings').get("recommender");
log = require('../core/logger').getLogger("recommender");
ledefactor = require(ledefactor);
var dataLayer = require('../core/datalayer');
var _ = require('underscore');

function generateDailyEmails(numberOfLedes) {
	// Get all users

	// For each unique user:
	// <async> fetchLedesForUser

} 

function fetchLedesForUser(user) {
  // For the given user, get all the ledes from the database (callback: resolveLedesToPosts)
}

function resolveLedesToPosts(ledes) {
  // Check posts database for lede url (callback: getTopRelatedPosts)
}

function getTopRelatedPosts(post) {
  // Step over this for each top related post and get all the results into an array. Flatten the array, and take the top 5 highest ledefactor posts.
  ledefactor.getTopRelatedPosts(post, parallel());
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
