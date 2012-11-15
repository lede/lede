var _ = require('underscore');
var util = require('util');
var dataLayer = require('../core/datalayer');
var validator = require('../core/validator');
var queues = require('../core/resque-queues');
var htmlparser = require('htmlparser');
var select = require('soupselect').select;
var url = require('url');
var Step = require('step');

// TODO try to identify and longify tiny URLs and click-tracking URLs
function extractLinks(post, callback) {
  try {
    var handler = new htmlparser.DefaultHandler(function (err, dom) {
      if (err) {
        throw err;
      }

      // might want to directly reference the attribs instead of just links
      var anchors = select(dom, 'a');
      links = _.compact(_.map(anchors, function(link) {
        if ('attribs' in link && 'href' in link.attribs) {
          return { text: link.children[0].data, href: link.attribs.href };
        } else {
          return null;
        }
      }));

      Step(
        function() {
          var group = this.group();

          _.each(links, function(link) {
            var parsedUrl = url.parse(link.href);
            var resolvedUrl = link.href;
            var cb = group();

            // detect relative urls by seeing if the url has a host
            if(! parsedUrl.hostname) {
              log.debug("Parsed relative url " + util.inspect(parsedUrl));

              //If we have real path info or a real query, try to resolve the url
              if(parsedUrl.pathname || parsedUrl.query) {
                log.debug("Created resolved url " + resolvedUrl);
                resolvedUrl = url.resolve(post.uri, link.href);
              } else {
                log.debug("Failed to resolve url " + link.href);
                cb("Failed to resolve url " + link.href);
                return;
              }
            }

            // Check for not http(s) protocols, this handles javascript: and mailto: 
            if (url.parse(resolvedUrl).protocol != 'http:' && url.parse(resolvedUrl).protocol != 'https:') {
              log.debug("Detected link to non http(s) with " + resolvedUrl);
              cb("Detected link to non http(s) with " + resolvedUrl);
              return;
            }

            validator.checkUrlValid(resolvedUrl, function(isValid) {
              if(isValid) {
                log.info("Adding link from post " + post.id + ' to ' + resolvedUrl );
                addLink(post.id, link.text, resolvedUrl, function(err, result) {
                  log.debug("Enqueing discover job for url " + resolvedUrl);
                  queues.slowDiscover.enqueue({ parentId: post.id, url: resolvedUrl}); // TODO if and when this offers a callback, use it
                  cb(null, resolvedUrl);
                });
              } else {
                log.debug("URL " + resolvedUrl + " has been tossed from indexer by blacklist, not trying to enqueue");
                cb("URL " + resolvedUrl + " has been tossed from indexer by blacklist, not trying to enqueue", null); // TODO use a proper error object to make this more semantic
              }
            });

          });
        },
        callback
      );
    });

    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(post.content);
  } catch (e) {
    log.error("Error while extracting links: " + util.inspect(e));
    callback(e);
  }
}

function addLink(postId, linkText, url, callback) {
  var linkContent = {
    from_post_id: postId,
    link_text: linkText,
    uri: url
  };

  dataLayer.Link.create(linkContent, function (err, linkCreated) {
    if(err) {
      log.error("Failed adding link to database" + err.message);
    } else {
      log.trace("Added link to database");
    }

    callback(err, linkCreated);
  });
}

exports.processPostContent = function (post, callback) {
  return extractLinks(post, callback);
}
