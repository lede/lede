var http = require('http');
var https = require('https');
var url = require('url');
var util = require('util');
var dataLayer = require('./datalayer');
var _ = require('underscore');
var mime = require('./mime-parser');

// getter objects for different protocols
var getters = {
  "http:": http,
  "https:": https
};

/** make an HTTP or HTTPS request to a remote server for a resource.
 * @note originally this was just for fetching feeds, but now it can fetch anything... it should probably be renamed, but it still has enough feed-specific functionality that I haven't changed it
 * @param source  Source object (must have a 'url' property)
 * @param done  callback that is called when we're done
 * @param options  optional hash of options for the request.  options include:
 *                  redirectCallback -- a callback called when we encounter a redirect.  defaults to just calling fetchFeed again with the new URL
 *                  feedName -- a function to run on the Source which returns a human-readable name (necessary because sometimes the source argument doesn't have an 'id' property)
 *                  urlOverride -- a different URL to use other than the one in source.url
 *                  requestFilter -- a function that gets the response object as a param to decide if we want this response.  request continues if it returns false.  it should return an Error object detailing the reason for rejection if it wants the request to be aborted
 */
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

  /* Various protections against insane stuff coming in here.
   * So far we've seen (and now check for):
   * -- undefined
   * -- an unknown object (non-string)
   * We'll just check it's defined and a string now, but ultimately we should see where these are coming from.
   */
  if(_.isUndefined(source.url) || typeof(source.url) != 'string') {
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

  var request = getters[requestParams.protocol].get(requestParams, function(response) {
    var bodyData = "";
    log.debug("Response status code " + response.statusCode);
    log.debug("Got headers: " + util.inspect(response.headers));

    if (response.statusCode != 200) {
      switch (response.statusCode) {
        case 301:
          log.debug("Source " + options.feedName(source) + " moved permanently (301) from '" + source.url + "' to '" + response.headers['location'] + "'");

          options.urlOverride = response.headers['location'];
          options.redirectCallback(source, done, options, response.statusCode);
          break;
          
        case 302:
        case 307:
          log.debug("Source " + options.feedName(source) + " moved temporarily (" + response.statusCode + ") from '" + source.url + "' to '" + response.headers['location'] + "'");
          options.urlOverride = response.headers['location'];
          options.redirectCallback(source, done, options, response.statusCode);
          break;

        default:
          log.debug("Response headers: " + util.inspect(response.headers));
          done(new Error("Received HTTP status code " + response.statusCode));
          break;
      }
      return;
    }

    // filter out requests we don't like
    if (options.requestFilter) {
      var err = options.requestFilter(response);
      if (err) {
        request.abort();
        done(err);
        return;
      }
    }

    // TODO set timeout on the request?

    response.setEncoding('utf8');

    response.on('data', function (chunk) {
      try {
        bodyData += chunk;
      } catch (e) {
        log.error("DISCOVERER PARSE ERROR" + util.inspect(e));
        done(e);
      }
    });
    response.on('end', function() {
      done(null, { source: source, body: bodyData });
    });
  }).on('error', function(e) {
    //console.log("Got error: " + e.message);
    done(e);
  });
}

// a size filter to be passed as options.requestFilter to fetchFeed()
function filterSize(response) {
  try {
    var length = parseInt(response.headers['content-length'], 10);
    if (_.isNaN(length) || length == 0) {
      return new Error("Response does not provide a content-length");
    } else if (length > settings.currentModule.maxFetchSize) {
      return new Error("Response is too large: " + length);
    } else {
      log.debug("Content length of " + length + " is under limit of " + settings.currentModule.maxFetchSize);
      return false;
    }
  } catch (ex) {
    return new Error("Error parsing content-length from response header: " + util.inspect(ex));
  }
}

// creates a filter suitable for use with options.requestFilter for fetchFeed() that filters out content types not in the list
function createContentTypeFilter(contentTypes) {
  if (!_.isArray(contentTypes)) {
    contentTypes = [contentTypes];
  }

  return function (response) {
    if (!_.include(contentTypes, mime.parse(response.headers['content-type']).mimeType)) {
      return new Error("Unacceptable Content-type '" + response.headers['content-type'] + "'");
    }
    
    return false;
  }
}

exports.fetchFeed = fetchFeed;
exports.filterSize = filterSize;
exports.createContentTypeFilter = createContentTypeFilter;
