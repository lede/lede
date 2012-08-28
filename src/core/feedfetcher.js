var http = require('http');
var https = require('https');
var url = require('url');
var util = require('util');
var dataLayer = require('./datalayer.js');
var _ = require('underscore');

// getter objects for different protocols
var getters = {
  "http:": http,
  "https:": https
};

function fetchFeed(source, done, options) {
  if (!options) {
    options = {};
  }

  if (!options.redirectCallback) {
    options.redirectCallback = fetchFeed;
  }

  if (!options.feedName) {
    options.feedName = function (source) { return "'" + source.url + "'" };
  }

  if(_.isUndefined(source.url)) {
    done(new Error("Undefined url passed to discoverer, skipping"));
    return;
  }
  var requestParams = url.parse(options.urlOverride ? options.urlOverride : source.url);

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
    "User-Agent": "Feedfetcher-Lede; (+http://unburythelede.com/feedfetcher.html" + (source.id ? "; source-id=" + source.id : "") + ")"
  };

  log.debug("Connecting to: " + util.inspect(requestParams));

  // TODO request HEAD and only do a GET if it has been changed

  getters[requestParams.protocol].get(requestParams, function(res) {
    var bodyData = "";
    log.debug("response status code " + res.statusCode);
    log.info("Got headers: " + util.inspect(res.headers));

    if (res.statusCode != 200) {
      switch (res.statusCode) {
        case 301:
          log.debug("Source " + options.feedName(source) + " moved permanently (301) from '" + source.url + "' to '" + res.headers['location'] + "'");

          options.urlOverride = res.headers['location'];
          options.redirectCallback(source, done, options, res.statusCode);
          break;
          
        case 302:
        case 307:
          log.debug("Source " + options.feedName(source) + " moved temporarily (" + res.statusCode + ") from '" + source.url + "' to '" + res.headers['location'] + "'");
          options.urlOverride = res.headers['location'];
          options.redirectCallback(source, done, options, res.statusCode);
          break;

        default:
          log.debug("Response headers: " + util.inspect(res.headers));
          done(new Error("received HTTP status code " + res.statusCode));
          break;
      }
      return;
    }

    // bail if the size is too large
    var MAX_CONTENT_SIZE = 5000000; // TODO: move this elsewhere, pick a sane limit, and filter by mimetype
    try {
      if(parseInt(res.headers['content-length']) > MAX_CONTENT_SIZE) {
        done(new Error("Feed is too large: " + res.headers['content-length']));
        return;
      } else {
        log.info("Checked content-length, under limit.");
      }
    } catch(ex) {
      done(new Error("Error parsing content-length from response header:" + util.inspect(ex)));
      return;
    }

    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      bodyData += chunk;
    });
    res.on('end', function() {
      done(null, { source: source, body: bodyData });
    });
  }).on('error', function(e) {
    //console.log("Got error: " + e.message);
    done(e);
  });
}

exports.fetchFeed = fetchFeed;
