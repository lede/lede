log = require('../core/logger').getLogger("discoverer");
var _ = require('underscore');
var util = require('util');
var settings = require('./' + process.argv[2]); // TODO hack!
var dataLayer = require('./datalayer');
var Step = require('step');
var feedFetcher = require('./feedfetcher');
var NodePie = require('nodepie');
var os = require('os');
var htmlparser = require('htmlparser');
var select = require('soupselect').select;
var subscribe = require('./subscribe');

var redis = require('redis').createClient(settings.redisConnectionParams.port, settings.redisConnectionParams.host);
redis.on('error', function(e) {
  log.fatal(e.message);
  process.exit(1);
});

var resque = require('resque').connect({redis: redis});

function parseMetadata(feed, xml, done) {
  try {
    log.trace("parsing feed");

    var indexTime = new Date();

    var parser = new NodePie(xml, { keepHTMLEntities: true });
    parser.init();

    if (parser.getDescription()) {
      feed.description = parser.getDescription();
    }

    if (parser.getTitle()) {
      feed.title = parser.getTitle();
    }

    done(null, feed);
  } catch (e) {
    done(e);
  }
}

// enumerate feeds provided by the web page whose body is provided
function fetchOfferedFeedUrls(siteBody, done) {
  try {
    var parser = new htmlparser.Parser(new htmlparser.DefaultHandler(function(err, dom) {
      if (err) {
        done(err);
      } else {
        var links = _.filter(select(dom, "link"), function(e) {
          return /(rss|atom)/i.test(e.attribs.type);
        });

        done(null, _.map(links, function(e) {
          return e.attribs.href;
        }));
      }
    }));

    parser.parseComplete(siteBody);
  } catch (e) {
    done(e);
  }
}

/** enumerates all the feeds offered by a site (including their metadata).
 * @param siteBody  the body of the request of the site offering the feeds
 * @param done  callback.  results will be an array of feed objects (url, title, description, and if the feed was located in the DB, id).
 */
function fetchOfferedFeeds(siteBody, done) {
  fetchOfferedFeedUrls(siteBody, function(err, feedsOffered) {
    if (err) {
      done(err);
    } else {
      var feedsOfferedMetadata = [];

      if (feedsOffered.length == 0) { // we check this specifically because the Step() will never return if there are no elements
        done(null, []);
        return;
      }

      Step(
        function () {
          var group = this.group();

          _.each(feedsOffered, function (feedUrl) {
            var callback = group();

            log.trace("Site offers feed '" + feedUrl + "'");

            fetchFeedMetadata(feedUrl, function (err, result) {
              if (err) {
                log.debug("fetching metadata for feed '" + feedUrl + "': " + err.message);
                callback(err);
              } else {
                feedsOfferedMetadata.push(result);
                callback(null);
              }
            });
          });
        },
        function (err, result) {
          done(err, feedsOfferedMetadata);
        }
      );
    }
  });
}

// searches the database for a feed with the given URL
function lookupFeed(feedUrl, done) {
  dataLayer.Source.findOne({ url: feedUrl }, { only: [ 'id', 'title', 'description', 'url' ]}, done);
}

/** find the feed by URL if it exists in the DB, or insert it if it doesn't exist.
 * @param feed  an object representing a feed (not necessarily a Source object as returned by the datalayer) consisting of "url", "title", and "description" fields which
 * will be inserted into the DB.  URL must be the canonical
 * URL (followed all redirects, etc).  if the feed object contains an ID field, it is assumed that this is known to be the ID in the database, and it just calls done with the feed as the result argument.
 * @param done  receives error or result.  the result will be the feed info (not an actual Source object; "id", "title", "description", "url") 
 */
function addNewFeed(feed, done) {
  dataLayer.Source.create(feed, function (err, result) {
    if (err) {
      done(err);
    } else {
      log.debug("Added new feed to database (" + result.rows[0].id + "), initiating fasttrack index");
      // TODO add a callback UUID to the enqueue and return it to the client
      resque.enqueue('fasttrack_index', 'Resque::Fasttrack_index', { feed: result.rows[0].id });
      done(null, result.rows[0]);
    }
  });
}

/** get metadata (url, title, description) of a feed.  checks the database for the feed first, and if it isn't found there, it requests the URL (following redirects) and then parses the result
 * @param url   the URL to get metadata for
 * @param done  receives error or result. result is an object:
 *   url: the URL of the feed, which may not be the same URL you passed in if redirects were encountered, etc
 *   title: the title of the feed
 *   description: the description of the feed
 *   id: this field will only be present if the feed was retrieved from the DB
 */
function fetchFeedMetadata(url, done) {
  lookupFeed(url, function (err, result) { // check the DB.  if it's there, then it must be a feed!
    if (err) { // database errors are nonrecoverable
      done(err);
      return;
    }

    if (result) { // we found it, so we're done
      log.trace("feed metadata found in database");
      done(null, result);
      return;
    }

    // if it wasn't found, do a request and then try to parse it
    // TODO
    var fetchOptions = {
      noDatabase: true,
      redirectCallback: function (feed, done, options, statusCode) {
        log.trace("recursing fetchFeedMetadata due to redirect");
        fetchFeedMetadata(options.urlOverride, done);
      }
    };

    function handleFeedData(err, results) {
      if (err) {
        done(err, results); // because this handler will get stacked multiple levels deep, we need to pass results here for the same reason as below (every instance of the handler except the "bottom" one will go through this path instead of the else statement
      } else {
        parseMetadata(results.feed, results.body, function (err, feed) {
          if (err) {
            done(err, results); // keep the request results because if it contains a body we want to use it
          } else {
            done(null, feed);
          }
        });
      }
    }

    feedFetcher.fetchFeed({ url: url }, handleFeedData, fetchOptions);
  });
}

/** perform the actual discover task from the resque
 */
function discover(jobParams) {
  var job = this;

  log.info("Performing discovery for '" + jobParams.url + "'");

  function setResqueCallback(err, results) {
    // TODO
    if (err) {
      log.error("Discovery for '" + jobParams.url + "' failed: " + err.message);
      if (jobParams.callback) {
        redis.hset("resque_callbacks", jobParams.callback, JSON.stringify({ error: err.message }));
      }
      job.fail({exception: err.name, error: err.message});
    } else {
      log.debug("Discovery yielded: " + util.inspect(results));
      if (jobParams.callback) {
        redis.hset("resque_callbacks", jobParams.callback, JSON.stringify(results));
      }
      job.succeed();
    }
  }

  function handleSpecificFeedFound(feed) {
    if (jobParams.subscribe) {
      log.debug("Subscribing user " + jobParams.subscribe.userId + " to feed " + feed.id);
      subscribe.subscribe(jobParams.subscribe.userId, feed.id, jobParams.subscribe.folderId, function(err, result) {
        if (err) {
          setResqueCallback(err);
        } else {
          setResqueCallback(null, feed);
        }
      });
    } else {
      setResqueCallback(null, feed);
    }
  }

  fetchFeedMetadata(jobParams.url, function (err, result) {
    if (err) {
      if (result && result.body) { // parse failed but we got a body back, assume it's a regular web site and search it for feed links
        log.debug("fetch feed metadata for '" + jobParams.url + "' failed: " + err.message);

        fetchOfferedFeeds(result.body, function (err, result) {
          if (!err) {
            log.info("Found " + result.length + " feeds offered by '" + jobParams.url + "'");
          }
          setResqueCallback(err, result);
        });
      } else { // it's just a plain old failure
        setResqueCallback(err);
      }
    } else if (result.id) { // we found an existing feed
      log.info("Source " + result.id + " found by direct URL");
      handleSpecificFeedFound(result);
    } else { // we found a brand new feed
      log.info("New feed found by direct URL: " + result.url);
      addNewFeed(result, function (err, result) {
        if (!err) {
          var filteredResult = {};
          _.each([ 'id', 'title', 'description', 'url' ], function (x) {
            filteredResult[x] = result[x];
          });
          handleSpecificFeedFound(filteredResult);
          return;
        }
        setResqueCallback(err);
      });
    }
  });
}

var jobs = {
  "Resque::Fast_discovery": discover,
  "Resque::Slow_discovery": discover
};

var workers = [];

function startWorker(queue, name) {
  var worker = resque.createWorker(queue, name, jobs);

  worker.start();

  workers.push(worker);
}

process.on('SIGINT', function() {
  log.info("Caught SIGINT, exiting");
  _.each(workers, function(worker) { worker.finish(); });
  setTimeout(process.exit, 1000);
});

// create workers per config file
_.each(_.keys(settings.discoverer.workers), function(queue) {
  _(settings.discoverer.workers[queue]).times(function(i) {
    startWorker(queue, os.hostname() + "-" + i);
  });
});
