settings = require('../core/settings').get("discoverer");
log = require('../core/logger').getLogger("discoverer");
var _ = require('underscore');
var util = require('util');
var dataLayer = require('../core/datalayer');
var validator = require('../core/validator');
var Step = require('step');
var feedFetcher = require('../core/feedfetcher');
var os = require('os');
var htmlparser = require('htmlparser');
var select = require('soupselect').select;
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

var contentTypeFilter = feedFetcher.createContentTypeFilter(['text/html', 'text/xhtml+xml']);

// enumerate feeds provided by the web page whose body is provided
function parseOfferedFeedUrls(siteBody, done) {
  try {
    var parser = new htmlparser.Parser(new htmlparser.DefaultHandler(function(err, dom) {
      if (err) {
        log.error("error: " + util.inspect(err));
        done(err);
      } else {
        log.trace("parsing");
        var links = _.filter(select(dom, "link"), function(e) {
          return /(rss|atom)/i.test(e.attribs.type);
        });

        done(null, _.map(links, function(e) {
          return e.attribs.href;
        }));
      }
    }));
    log.trace("Built parser");
    parser.parseComplete(siteBody);
  } catch (e) {
    log.error("error caught: " + util.inspect(e));
    done(e);
  }
}

/**
 * Searches the database for a feed with the given URL
 */
function lookupFeed(feedUrl, done) {
  dataLayer.Source.findOne(
    { url: feedUrl }, 
    { only: [ 'id', 'title', 'description', 'url' ]}, 
    done);
}

/** 
 * Find the feed by URL if it exists in the DB, or insert it if it doesn't exist.
 * @param url  URL of the source to add
 * @param done  receives error or result.  the result will be the feed info (not an actual Source object; "id", "title", "description", "url") 
 */
function addNewSource(url, fast, done) {
  dataLayer.Source.create({ url: url, indexable: true, index_interval: settings.defaultSourceIndexInterval }, function (err, result) {
    if (err) {
      if (/sources_url_unique/.test(err.message)) { // TODO figure out if we can detect this error in a less hacky way
        log.debug("Source '" + url + "' already exists in DB");
        done(null, null);
      } else {
        done(err);
      }
    } else {
      log.debug("Added new source to database (" + result.rows[0].id + "), initiating index");
      if (fast) {
        queues.fastIndex.enqueue({ source: result.rows[0].id });
      } else {
        queues.slowIndex.enqueue({ source: result.rows[0].id });
      }
      done(null, result.rows[0]);
    }
  });
}

function fetchWebPage(url, done) {
  var fetchOptions = {
    redirectCallback: function (feed, done, options, statusCode) {
      log.trace("recursing fetchWebPage due to redirect");
      fetchWebPage(options.urlOverride, done);
    },
    requestFilter: function (response) {
      var err = feedFetcher.filterSize(response);
      if (err) {
        return err;
      }

      err = contentTypeFilter(response);
      if (err) {
        return err;
      }

      return false;
    }
  };

  feedFetcher.fetchFeed({ url: url }, done, fetchOptions);
}

/** 
 * Perform the actual discover task from the resque
 */
function discover(fast, jobParams, job) {
  log.info("Performing discovery for '" + jobParams.url + "'");

  fetchWebPage(jobParams.url, function (err, result) {
    if (err) {
      log.error("Fetch of '" + jobParams.url + "' failed: " + err.message);
      job.fail({ exception: err.name, error: err.message });
    } else {
      parseOfferedFeedUrls(result.body, function (err, feedsOffered) {
        if (err) {
          log.error("Parse of '" + jobParams.url + "' failed: " + err.message);
          job.fail({ exception: err.name, error: err.message });
        } else {
          if (feedsOffered.length == 0) { // test this explicitly because Step can't handle zero-length arrays
            // TODO handle web pages that don't offer feeds by doing some magic content extraction
            log.debug("url '" + jobParams.url + "' does not offer any feeds");
            if ( _.isUndefined(job) ) {
              log.error("job is undefined");
            } else {
              job.succeed();
            }
            return;
          }

          Step(
            function () {
              var group = this.group();

              _.each(feedsOffered, function (feedUrl) {
                var callback = group();

                log.trace("Site offers feed '" + feedUrl + "'");

                validator.checkUrlValid(feedUrl, function(isValid) {
                  if(isValid) {
                    addNewSource(feedUrl, fast, callback);
                  } else {
                    log.info("URL "+ feedUrl +" has been tossed from discoverer by blacklist, not trying to add source");
                    callback(null, null);
                  }
                });
              });
            },

            function (err, result) {
              if (err) {
                log.error("Insert of Source failed: " + err.message);
                job.fail({ exception: err.name, error: err.message });
              } else {
                var numNewFeeds = _.compact(result).length;
                var numOldFeeds = result.length - numNewFeeds;
                log.info("Added " + numNewFeeds + " feeds offered by '" + jobParams.url + "'" + (numOldFeeds ? " (ignored " + numOldFeeds + " feeds already in DB)" : ""));
                job.succeed();
              }
            }
          );
        }
      });
    }
  });
}

var jobs = {}

jobs[queues.fastDiscover.functionName] = function(jobParams) {
 discover(true, jobParams, this);
}
jobs[queues.slowDiscover.functionName] = function(jobParams) {
  discover(false, jobParams, this);
}


var workers = [];

function startWorker(queue, name) {
  var worker = queues.resque.createWorker(queue, name, jobs);

  worker.start();

  workers.push(worker);
}

process.on('SIGINT', function() {
  log.info("Caught SIGINT, exiting");
  _.each(workers, function(worker) { worker.finish(); });
  // TODO delay until workers complete their task
  setTimeout(process.exit, 1500);
});

// create workers per config file
_.each(_.keys(settings.discoverer.workers), function(queue) {
  _(settings.discoverer.workers[queue]).times(function(i) {
    startWorker(queue, os.hostname() + "-" + i);
  });
});
