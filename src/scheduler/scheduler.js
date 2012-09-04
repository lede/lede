settings = require('../core/settings').get("scheduler");
log = require('../core/logger').getLogger("scheduler");
var _ = require('underscore');
var util = require('util');
var dataLayer = require('../core/datalayer');

var queues = require('../core/resque-queues');

// handle top-level exceptions
process.on('uncaughtException',function(error){
  log.fatal('Top-Level Uncaught Exception: ' + error);
  log.fatal(error.stack);
  log.fatal('Exiting in 10 seconds...');
  setTimeout(function() {
    log.fatal('Exiting.');
    process.exit(1);
  }, 10000);
});

function findStaleSources(callback) {
  var indexTime = new Date();

  log.debug("Finding sources due to be indexed before " + indexTime.toUTCString());

  dataLayer.Source.find(
    {
      "next_index_at.lte.or_null": indexTime,
      "indexable": true
    },
    {
      only: [ 'id' ]
    },
    callback);
}

function enqueueSources(err, sources) {
  if (err) {
    log.error("Finding stale sources: " + err.message);
    return;
  }
  
  log.info("Found " + sources.length + " stale source(s)");

  _.each(sources, function(source) {
    log.debug("Enqueuing source " + source.id);
    queues.slowIndex.enqueue({ source: source.id });
  });
}

function checkSources() {
  findStaleSources(enqueueSources);
}

process.on('SIGINT', function() {
  log.info("Caught SIGINT, exiting");
  process.exit(0);
});

log.info("Scheduler started");

setInterval(checkSources, settings.scheduler.checkInterval * 1000);
checkSources(); // call it immediately since the above will delay one interval period before calling
