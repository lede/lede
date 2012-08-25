// do lots of setup stuff
log = require('./logger').getLogger("indexer");
var util = require('util');

if (process.argv.length != 3) {
  log.fatal("Requires one argument that is the settings file to load");
  process.exit(1);
}

var feedFetcher = require('./feedfetcher');
var feedParser = require('./feedparser');
var dataLayer = require('./datalayer');
var _ = require('underscore');
var settings = require('./' + process.argv[2]); // TODO hack!
var os = require('os');

var redis = require('redis').createClient(settings.redisConnectionParams.port, settings.redisConnectionParams.host);
redis.on('error', function(e) {
  log.fatal(e.message);
  process.exit(1);
});

var resque = require('resque').connect({redis: redis});

// useful code begins here

function redisJobCompleteCallback(callbackId, status) {
  redis.hset("resque_callbacks", callbackId, status ? "success" : "failure");
}

function fetchAndParse(feed, done) {
  feedFetcher.fetchFeed(feed, function (err, results) {
    if (err) {
      done(err);
    } else {
      feedParser.parseFeed(results.feed, results.body, done);
    }
  });
}

function indexFeed(jobParams) {
  var job = this;

  log.info("Indexing feed " + jobParams.feed + " (" + job.worker.queue + ")");

  dataLayer.Source.findOne(jobParams.feed, function(err, result) {
    var done = function(err) {
      if (err) {
        log.error("Indexing feed " + jobParams.feed + ": " + err);

        if (jobParams.callback) {
          redisJobCompleteCallback(jobParams.callback, false);
        }

        job.fail({ exception: err.name, error: err.message });
      } else {
        log.info("Index of feed " + jobParams.feed + " succeeded");

        if (jobParams.callback) {
          redisJobCompleteCallback(jobParams.callback, true);
        }

        job.succeed();
      }
    };

    if (err) {
      done(err);
      return;
    }

    if (result == null) {
      done(new Error("feed not found in the database"));
      return;
    }

    if (!result.indexable) {
      log.error("Aborting index of feed " + jobParams.feed + " because it is not marked as indexable");

      if (jobParams.callback) {
        redisJobCompleteCallback(jobParams.callback, false);
      }

      job.fail();
      return;
    }

    if (result.indexed_at > new Date(Date.now() - settings.indexer.throttleInterval * 1000)) {
      log.warn("Aborting index of feed " + jobParams.feed + " because it has been updated in the last " + settings.indexer.throttleInterval + " seconds");

      if (jobParams.callback) {
        redisJobCompleteCallback(jobParams.callback, false);
      }

      job.succeed(); // TODO might we want to make this succeed/fail be configurable per job, or per queue?
      return;
    }

    var options = {
      redirectCallback: function (feed, done, options, statusCode) {
        if (statusCode == 301) { // permanent redirect
          feed.url = options.urlOverride; // update it in-memory so it stays consistent

          dataLayer.Source.update(feed.id, { url: feed.url }, function(err, result) {
            if (err) {
              done(err);
              return;
            } else {
              fetchAndParse(feed, done, options);
            }
          });
        } else {
          fetchAndParse(feed, done, options);
        }
      },
      feedName: function (feed) { return feed.id }
    };

    fetchAndParse(result, done, options);

  });
}

var jobs = {
  "Resque::Fasttrack_index": indexFeed,
  "Resque::Scheduled_index": indexFeed
};

var workers = [];

function startWorker(queue, name) {
  var worker = resque.createWorker(queue, name, jobs);

  // Triggered every time the Worker polls.
  //worker.on('poll', function() { log.trace("Polling resque...")});

  // Triggered before a Job is attempted.
  //worker.on('job', function(job) { log.info("Indexing feed " + util.inspect(job))});

  // Triggered every time a Job errors.
 // worker.on('error', function(job) { log.error("Source " + job.feed + " error: " + err.message)});

  // Triggered on every successful Job run.
  //worker.on('success', function(job) { log.info("Source " + job.feed + " processed successfully")});

  worker.start();

  workers.push(worker);

  //log.info("Resque worker started, waiting for jobs on queue '" + queue + "'");
}

process.on('SIGINT', function() {
  log.info("Caught SIGINT, exiting");
  _.each(workers, function(worker) { worker.finish(); });
  process.exit(0);
});

// create workers per config file
_.each(_.keys(settings.indexer.workers), function(queue) {
  _(settings.indexer.workers[queue]).times(function(i) {
    startWorker(queue, os.hostname() + "-" + i);
  });
});
