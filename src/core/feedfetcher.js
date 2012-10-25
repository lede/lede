var http = require('http');
var https = require('https');
var url = require('url');
var util = require('util');
var dataLayer = require('./datalayer');
var _ = require('underscore');
var mimeParser = require('./mime-parser');
var errors = require('./errors.js');

// exception used when an otherwise valid response is rejected by the filter
function ResponseFilteredError(message) {
  this.name = "ResponseFilteredError";
  this.message = message || "Response was filtered";
}

ResponseFilteredError.prototype = new Error();
ResponseFilteredError.prototype.constructor = ResponseFilteredError;
exports.ResponseFilteredError = ResponseFilteredError;

// error for when the content type is not something we can use
function ContentTypeError(message) {
  this.name = "ContentTypeError";
  this.message = message || "Content type is invalid or couldn't be determined";
}

ContentTypeError.prototype = new ResponseFilteredError();
ContentTypeError.prototype.constructor = ContentTypeError;
exports.ContentTypeError = ContentTypeError;

// error for when a response is too large
function ResponseSizeError(message) {
  this.name = "ResponseSizeError";
  this.message = message || "Response size is too large or couldn't be determined";
}

ResponseSizeError.prototype = new ResponseFilteredError();
ResponseSizeError.prototype.constructor = ResponseSizeError;
exports.ResponseSizeError = ResponseSizeError;

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
    done(new URIError("Undefined url passed to discoverer, skipping"));
    return;
  }
  var requestParams = url.parse(options.urlOverride ? options.urlOverride : source.url);

  if (!requestParams.hostname) { // check for invalid hostnames (at this time, that really just means null, but maybe we should make it more robust in the future)
    done(new URIError("Hostname was not specified (or it couldn't be parsed)"));
    return;
  }

  if (!requestParams.protocol) {
    done(new URIError("Protocol was not specified (or it couldn't be parsed)"));
    return;
  }

  if (!getters[requestParams.protocol]) {
    done(new URIError("Unknown protocol '" + requestParams.protocol + "'"));
    return;
  }
  
  requestParams.headers = {
    "User-Agent": "Feedfetcher-Lede; (+http://unburythelede.com/feedfetcher.html" + (source.id ? "; source-id=" + source.id : "") + ")"
  };

  log.debug("Connecting to: " + util.inspect(requestParams));

  // TODO: request HEAD and only do a GET if it has been changed
  // TODO: It's possible we should copy the source so it gets GCd ... not sure if it isnt now

  try {
    var request = getters[requestParams.protocol].get(requestParams, function(response) {
      var bodyData = [];
      var currentBodySize = 0;

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
            done(new errors.ConnectionError("Received HTTP status code " + response.statusCode));
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

      response.setEncoding('utf8');

      response.on('data', function (chunk) {
        try {
          bodyData.push(chunk);
          currentBodySize += chunk.length;
          if(currentBodySize > settings.currentModule.maxFetchSize) {
            throw "Source lied or didn't specify content length (" + settings.currentModule.maxFetchSize + ") - reading went over the limit, bailing";
          }
        } catch (e) {
          request.abort();
          // Tell the GC to do its thang
          bodyData = null;
          currentBodySize = null;
          log.error("Error fetching feed: " + util.inspect(e));
          done(e);
        }
      });

      response.on('end', function() {
        try {
          if(!bodyData) {
            throw "Fetched item was larger than the max fetch size of " + settings.currentModule.maxFetchSize;
          }

          done(null, { source: source, body: bodyData.join('') });
        } catch (e) {
          log.error("Error fetching feed: " + util.inspect(e));
          done(e);
        } finally {
          // Tell the GC to do its thang
          bodyData = null;
          currentBodySize = null;
        }
      });
    }).on('error', function(e) {
      //console.log("Got error: " + e.message);
      var err = new errors.ConnectionError(e.message);
      err.cause = e;
      done(err);
    });

    request.setTimeout(settings.currentModule.fetchTimeout * 1000, function () {
      request.abort();
      done(new errors.ConnectionError("Socket timeout"));
    });
  } catch (e) {
    // sometimes this throws (we think) due to https://github.com/joyent/node/issues/3924
    var err = new errors.ConnectionError(e.message);
    err.cause = e;
    done(err);
  }
}

// a size filter to be passed as options.requestFilter to fetchFeed()
function filterSize(response) {
  try {
    var length = parseInt(response.headers['content-length'], 10);
    if (_.isNaN(length)) {
      log.debug("Content length unspecified, but we'll read until we hit the limit");
      return false; // we'll handle unspecified lengths when reading the stream and abort there
    } else if (length > settings.currentModule.maxFetchSize) {
      return new ResponseSizeError("Response is too large: " + length);
    } else {
      log.debug("Content length of " + length + " is under limit of " + settings.currentModule.maxFetchSize);
      return false;
    }
  } catch (ex) {
    return new ResponseSizeError("Error parsing content-length from response header: " + util.inspect(ex));
  }
}

// creates a filter suitable for use with options.requestFilter for fetchFeed() that filters out content types not in the list
function createContentTypeFilter(contentTypes) {
  if (!_.isArray(contentTypes)) {
    contentTypes = [contentTypes];
  }

  return function (response) {
    var contentType = response.headers['content-type'];
    var mime = mimeParser.parse(contentType);

    if(!mime) {
      return new ContentTypeError("Could not parse content type header '" + contentType + "'");
    }

    if (!_.include(contentTypes, mime.mimeType)) {
      return new ContentTypeError("Unacceptable Content-type '" + contentType + "'");
    }
    
    return false;
  }
}

exports.fetchFeed = fetchFeed;
exports.filterSize = filterSize;
exports.createContentTypeFilter = createContentTypeFilter;
