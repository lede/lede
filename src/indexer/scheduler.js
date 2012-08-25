log = require('./logger').getLogger("scheduler");
var _ = require('underscore');
var util = require('util');
var settings = require('./' + process.argv[2]); // TODO hack!
var dataLayer = require('./datalayer');

var resque = require('resque').connect(settings.redisConnectionParams);

function findStaleFeeds(callback) {
  var indexTime = new Date(Date.now() - (settings.scheduler.minimumIndexInterval * 1000));

  log.debug("Finding feeds indexed prior to " + indexTime.toUTCString());

  dataLayer.Source.find(
    {
      "indexed_at.lte.or_null": indexTime,
      "indexable": true
    },
    {
      only: [ 'id' ]
    },
    callback);
}

function enqueueFeeds(err, feeds) {
  if (err) {
    log.error("Finding stale feeds: " + err.message);
    return;
  }
  
  log.info("Found " + feeds.length + " stale feed(s)");

  _.each(feeds, function(feed) {
    log.debug("Enqueuing feed " + feed.id);
    resque.enqueue('scheduled_index', 'Resque::Scheduled_index', { feed: feed.id });
  });
}

function checkFeeds() {
  findStaleFeeds(enqueueFeeds);
}

process.on('SIGINT', function() {
  log.info("Caught SIGINT, exiting");
  process.exit(0);
});

log.info("Scheduler started");

setInterval(checkFeeds, settings.scheduler.checkInterval * 1000);
checkFeeds(); // call it immediately since the above will delay one interval period before calling
