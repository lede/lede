settings = require('../core/settings').get("recommender");
log = require('../core/logger').getLogger("recommender");
var recommender = require('./recommender');

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

recommender.fetchEditorsPicks(5, function(err, result) {
  if (err) {
    log.error(err);
  } else {
    log.info(result);
  }
});
