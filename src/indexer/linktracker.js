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

        if(resolvedUrl) {
          log.debug("Enqueing discover job for url " + resolvedUrl);
          queues.slowDiscover.enqueue({ parentId: post.id, url: resolvedUrl});
        } else {
          log.info("Resolved url is null, will not enqueue");
        }

      });
    });

    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(post.content);
  } catch (e) {
    log.error("Error while extracting links: " + util.inspect(e));
  }
}

exports.processPostContent = function (post) {
  return extractLinks(post);
}
