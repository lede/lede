// do lots of setup stuff
log = require('../core/logger').getLogger("indexer");
var util = require('util');

if (process.argv.length != 3) {
  log.fatal("Requires one argument that is the settings file to load");
  process.exit(1);
}

var feedFetcher = require('../core/feedfetcher');
var feedParser = require('./feedparser');
var dataLayer = require('../core/datalayer');
var _ = require('underscore');
var util = require('util');
var settings = require('../core/settings');
var os = require('os');
var queues = require('../core/resque-queues');

// handle top-level exceptions
process.on('uncaughtException',function(error){
  log.info('Uncaught: ' + error);
});

// useful code begins here

function redisJobCompleteCallback(callbackId, status) {
  queues.redis.hset("resque_callbacks", callbackId, status ? "success" : "failure");
}

function fetchAndParse(source, done) {
  feedFetcher.fetchFeed(source, function (err, results) { //crash
    if (err) {
      done(err);
    } else {
      feedParser.parseFeed(results.source, results.body, done);
    }
  });
}

function indexFeed(jobParams) {
  var job = this;

  log.info("Indexing source " + jobParams.source + " (" + job.worker.queue + ")");

  dataLayer.Source.findOne(jobParams.source, function(err, result) {
    var done = function(err) {
      if (err) {
        log.error("Indexing source " + jobParams.source + ": " + err);

        if (jobParams.callback) {
          redisJobCompleteCallback(jobParams.callback, false);
        }

        job.fail({ exception: err.name, error: err.message });
      } else {
        log.info("Index of source " + jobParams.source + " succeeded");

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
      done(new Error("Source not found in the database"));
      return;
    }

    if (!result.indexable) {
      log.error("Aborting index of source " + jobParams.source + " because it is not marked as indexable");

      if (jobParams.callback) {
        redisJobCompleteCallback(jobParams.callback, false);
      }

      job.fail();
      return;
    }

    if (result.indexed_at > new Date(Date.now() - settings.indexer.throttleInterval * 1000)) {
      log.warn("Aborting index of source " + jobParams.source + " because it has been updated in the last " + settings.indexer.throttleInterval + " seconds");

      if (jobParams.callback) {
        redisJobCompleteCallback(jobParams.callback, false);
      }

      job.succeed(); // TODO might we want to make this succeed/fail be configurable per job, or per queue?
      return;
    }

    var options = {
      redirectCallback: function (source, done, options, statusCode) {
        if (statusCode == 301) { // permanent redirect
          source.url = options.urlOverride; // update it in-memory so it stays consistent

          dataLayer.Source.update(source.id, { url: source.url }, function(err, result) {
            if (err) {
              done(err);
              return;
            } else {
              fetchAndParse(source, done, options);
            }
          });
        } else {
          fetchAndParse(source, done, options);
        }
      },
      feedName: function (source) { return source.id }
    };

    fetchAndParse(result, done, options);

  });
}

var jobs = {}

jobs[queues.fastIndex.functionName] = indexFeed;
jobs[queues.slowIndex.functionName] = indexFeed;

var workers = [];

function startWorker(queue, name) {
  var worker = queues.resque.createWorker(queue, name, jobs);

  // Triggered every time the Worker polls.
  worker.on('poll', function() { log.trace("Polling resque...")});

  // Triggered before a Job is attempted.
  worker.on('job', function(job) { log.info("Indexing source " + util.inspect(job))});

  // Triggered every time a Job errors.
  worker.on('error', function(job) { log.error("Source " + job.source + " error: " + err.message)});

  // Triggered on every successful Job run.
  worker.on('success', function(job) { log.info("Source " + job.source + " processed successfully")});

  worker.start();

  workers.push(worker);

  log.info("Resque worker started, waiting for jobs on queue '" + queue + "'");
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
