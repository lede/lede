var http = require('http');
var https = require('https');
var url = require('url');
var util = require('util');
var dataLayer = require('./datalayer.js');

// getter objects for different protocols
var getters = {
  "http:": http,
  "https:": https
};

function fetchFeed(feed, done, options) {
  if (!options) {
    options = {};
  }

  if (!options.redirectCallback) {
    options.redirectCallback = fetchFeed;
  }

  if (!options.feedName) {
    options.feedName = function (feed) { return "'" + feed.url + "'" };
  }

  var requestParams = url.parse(options.urlOverride ? options.urlOverride : feed.url);

  if (!requestParams.hostname) { // check for invalid hostnames (at this time, that really just means null, but maybe we should make it more robust in the future)
    done(new Error("Hostname was not specified (or it couldn't be parsed)"));
    return;
  }

  if (!requestParams.protocol) {
    done(new Error("Protocol was not specified (or it couldn't be parsed)"));
    return;
  }

  if (!getters[requestParams.protocol]) {
    done(new Error("Unknown protocol '" + requestParams.protocol + "'"));
    return;
  }
  
  requestParams.headers = {
    "User-Agent": "Feedfetcher-Lede; (+http://unburythelede.com/feedfetcher.html" + (feed.id ? "; feed-id=" + feed.id : "") + ")"
  };

  log.debug("Connecting to: " + util.inspect(requestParams));

  // TODO request HEAD and only do a GET if it has been changed

  getters[requestParams.protocol].get(requestParams, function(res) {
    var bodyData = "";
    log.debug("response status code " + res.statusCode);

    if (res.statusCode != 200) {
      switch (res.statusCode) {
        case 301:
          log.debug("Source " + options.feedName(feed) + " moved permanently (301) from '" + feed.url + "' to '" + res.headers['location'] + "'");

          options.urlOverride = res.headers['location'];
          options.redirectCallback(feed, done, options, res.statusCode);
          break;
          
        case 302:
        case 307:
          log.debug("Source " + options.feedName(feed) + " moved temporarily (" + res.statusCode + ") from '" + feed.url + "' to '" + res.headers['location'] + "'");
          options.urlOverride = res.headers['location'];
          options.redirectCallback(feed, done, options, res.statusCode);
          break;

        default:
          log.debug("Response headers: " + util.inspect(res.headers));
          done(new Error("received HTTP status code " + res.statusCode));
          break;
      }
      return;
    }

    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      bodyData += chunk;
    });
    res.on('end', function() {
      done(null, { feed: feed, body: bodyData });
    });
  }).on('error', function(e) {
    //console.log("Got error: " + e.message);
    done(e);
  });
}

exports.fetchFeed = fetchFeed;
