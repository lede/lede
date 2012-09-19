var _ = require('underscore');
var util = require('util');
var dataLayer = require('../core/datalayer');
var queues = require('../core/resque-queues');
var htmlparser = require('htmlparser');
var select = require('soupselect').select;
var url = require('url');

// TODO try to identify and longify tiny URLs
function extractLinks(post) {
  try {
    var handler = new htmlparser.DefaultHandler(function (err, dom) {
      if (err) {
        throw err;
      }

      // might want to directly reference the attribs instead of just links
      var links = select(dom, 'a');
      var attribs = _.pluck(links, "attribs");
      var hrefs = _.pluck(_.compact(attribs), "href");
      hrefs = _.compact(hrefs);

      _.each(hrefs, function(href) {
        var parsedUrl = url.parse(href);
        var resolvedUrl = href;

        // detect relative urls by seeing if the url has a host
        if(! parsedUrl.host) {
          log.debug("Parsed relative url " + util.inspect(parsedUrl));

          //If we have real path info or a real query, try to resolve the url
          if(parsedUrl.pathname || parsedUrl.query) {
            log.debug("Created resolved url " + resolvedUrl);
            resolvedUrl = url.resolve(post.uri, href);
          } else {
            log.debug("Failed to resolve url " + href);
            resolvedUrl = null;
          }
        }

        // Check for not http(s) protocols, this handles javascript: and mailto: 
        if (url.parse(resolvedUrl).protocol != 'http:' && url.parse(resolvedUrl).protocol != 'https:') {
          log.debug("Detected link to non http(s) with " + resolvedUrl);
          resolvedUrl = null;
        }

        // Naive handling of blacklisting
        dataLayer.Blacklist.findOne({url: url.parse(resolvedUrl).hostname}, function(error, result) {
          if (result) {
            log.error("Detected blacklist match on " + result.url);
            resolvedUrl = null;
          } else {
            // We should now have a followable http(s) link 
            if(resolvedUrl) {
              log.info("Adding link from post " + post.id + ' to ' + resolvedUrl );
              addLink(post.id, resolvedUrl);
              log.info("Enqueing discover job for url " + resolvedUrl);
              queues.slowDiscover.enqueue({ parentId: post.id, url: resolvedUrl});
            } else {
              log.info("Resolved url is null, will not enqueue");
            }
          }
        });
      });
    });

    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(post.content);
  } catch (e) {
    log.error("Error while extracting links: " + util.inspect(e));
  }
}

function addLink(postId, url) {
  var linkContent = {
    from_post_id: postId,
    uri: url
  };

  dataLayer.Link.create(linkContent, linkCreated); 
}

function linkCreated(err, linkCreated) {
  if(err) {
    log.error("Failed adding link to database" + err.message);
    return;
  }

  log.trace("Added link to database");
}

exports.processPostContent = function (post) {
  return extractLinks(post);
}
