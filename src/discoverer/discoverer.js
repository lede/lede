log = require('../core/logger').getLogger("discoverer");
var _ = require('underscore');
var util = require('util');
var settings = require('../core/settings');
var dataLayer = require('../core/datalayer');
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

// enumerate feeds provided by the web page whose body is provided
function parseOfferedFeedUrls(siteBody, done) {
  try {
    log.info("starting parseOfferedFeedUrls");
    var parser = new htmlparser.Parser(new htmlparser.DefaultHandler(function(err, dom) {
      if (err) {
        log.info("error: " + util.inspect(err));
        done(err);
      } else {
        log.info("parsing");
        var links = _.filter(select(dom, "link"), function(e) {
          return /(rss|atom)/i.test(e.attribs.type);
        });

        done(null, _.map(links, function(e) {
          return e.attribs.href;
        }));
      }
    }));
    log.info("built parser");
    parser.parseComplete(siteBody);
  } catch (e) {
    log.info("error caught: " + util.inspect(e));
    done(e);
  }
}

// searches the database for a feed with the given URL
function lookupFeed(feedUrl, done) {
  dataLayer.Source.findOne({ url: feedUrl }, { only: [ 'id', 'title', 'description', 'url' ]}, done);
}

/** find the feed by URL if it exists in the DB, or insert it if it doesn't exist.
 * @param url  URL of the source to add
 * @param done  receives error or result.  the result will be the feed info (not an actual Source object; "id", "title", "description", "url") 
 */
function addNewSource(url, fast, done) {
  dataLayer.Source.findOne({url: url}, function(err, source) {
    if(!err && (_.isNull(source) || _.isUndefined(source))) {
      dataLayer.Source.create({ url: url, indexable: true, index_interval: 60 }, function (err, result) {
        if (err) {
          // TODO handle IDs that already exist in the DB; these should not be an error
          done(err);
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
    } else {
      if(err) {
        console.log("Error checking for dup source: " + err);
      }
      log.info("Skippping duplicate source: " + url);
    }
  });
}

function fetchWebPage(url, done) {
  var fetchOptions = {
    redirectCallback: function (feed, done, options, statusCode) {
      log.trace("recursing fetchWebPage due to redirect");
      fetchWebPage(options.urlOverride, done);
    }
  };

  feedFetcher.fetchFeed({ url: url }, done, fetchOptions);
}

/** perform the actual discover task from the resque
 */
function discover(jobParams) {
  var job = this;
  var fast = true;
  log.info("Performing discovery for '" + jobParams.url + "'");

  fetchWebPage(jobParams.url, function (err, result) {
    if (err) {
      log.error("Fetch of '" + jobParams.url + "' failed: " + err.message);
      job.fail({ exception: err.name, error: err.message });
    } else {
      parseOfferedFeedUrls(result.body, function (err, feedsOffered) {
        log.info("finished parseOfferedFeedsUrls");
        if (err) {
          log.error("Parse of '" + jobParams.url + "' failed: " + err.message);
          job.fail({ exception: err.name, error: err.message });
        } else {
          if (feedsOffered.length == 0) { // test this explicitly because Step can't handle zero-length arrays
            // TODO handle web pages that don't offer feeds by doing some magic content extraction
            log.info("Found web page that doesn't offer and feeds");
            if ( _.isUndefined(job) ) {
              log.info("job is undefined");
            } else {
              //log.info("job: " + util.inspect(job));
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

                addNewSource(feedUrl, fast, callback);
              });
            },
            function (err, result) {
              if (err) {
                log.info("Insert of Source failed: " + err.message);
                job.fail({ exception: err.name, error: err.message });
              } else {
                log.info("Added " + result.length + " feeds offered by '" + jobParams.url + "'");
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

jobs[queues.fastDiscover.functionName] = discover; 

jobs[queues.slowDiscover.functionName] = function (jobParams) {
  console.log("hello");
  log.info("Hello, from slowDiscover");
  discover(false, jobParams) 
};

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
