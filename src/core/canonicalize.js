var http = require('http');
var https = require('https');
var urlParser = require('url');
var util = require('util');
var errors = require('./errors.js');
var _ = require('underscore');

// getter objects for different protocols
var schemes = {
  "http:": http,
  "https:": https
};

function followLink(url, callback) {
  if(_.isUndefined(url) || typeof(url) != 'string') {
    callback(new URIError("URL is undefined"));
    return;
  }

  var requestParams = urlParser.parse(url);

  if (!requestParams.hostname) { // check for invalid hostnames (at this time, that really just means null, but maybe we should make it more robust in the future)
    callback(new URIError("Hostname was not specified (or it couldn't be parsed)"));
    return;
  }

  if (!requestParams.protocol) {
    callback(new URIError("Protocol was not specified (or it couldn't be parsed)"));
    return;
  }

  if (!schemes[requestParams.protocol]) {
    callback(new URIError("Unknown scheme '" + requestParams.protocol + "'"));
    return;
  }
  
  requestParams.headers = {
    "User-Agent": "Lede; (+http://unburythelede.com/indexer.html)"
  };

  requestParams.method = 'HEAD';

  log.debug("Connecting to: " + util.inspect(requestParams));

  try {
    var request = schemes[requestParams.protocol].request(requestParams, function(response) {
      log.debug("Response status code " + response.statusCode);
      log.debug("Got headers: " + util.inspect(response.headers));

      switch (response.statusCode) {
        case 200:
          callback(null, { statusCode: response.statusCode, url: url });
          break;

        case 301:
        case 302:
        case 307:
          callback(null, { statusCode: response.statusCode, url: url, next: response.headers['location'] });
          break;

        default:
          log.debug("Response headers: " + util.inspect(response.headers));
          callback(new errors.ConnectionError("Received HTTP status code " + response.statusCode));
          break;
      }
    }).on('error', function(e) {
      //console.log("Got error: " + e.message);
      var err = new errors.ConnectionError(e.message);
      err.cause = e;
      callback(err);
    });

    request.setTimeout(settings.currentModule.fetchTimeout * 1000, function () {
      request.abort();
      callback(new errors.ConnectionError("Socket timeout"));
    });

    request.end();
  } catch (e) {
    // sometimes this throws (we think) due to https://github.com/joyent/node/issues/3924
    var err = new errors.ConnectionError(e.message);
    err.cause = e;
    callback(err);
  }
}

/** canonicalizes a URL
 * callback params: err, canonical URL, path to the canonical URL through the redirects (an array, each element contains an object with properties 'statusCode', 'url', and 'next', the latter being the next URL in the sequence)
 */
exports.canonicalize = function(url, callback) {
  var urlStack = [];

  function recursiveFollow(url, cb) {
    followLink(url, function(err, result) {
      if (err) {
        cb(err);
      } else {
        urlStack.push(result);

        if (result.statusCode == 200) {
          cb(null);
        } else {
          recursiveFollow(result.next, cb);
        }
      }
    });
  }

  recursiveFollow(url, function(err) {
    if (err) {
      callback(err);
    } else {
      callback(null, urlStack[urlStack.length - 1].url, urlStack);
    }
  });
};
