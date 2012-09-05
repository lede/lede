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
        // detect relative urls by seeing if the url has a host
        if(parsedUrl.host) {
          log.debug("Enqueing discover job for url " + href);
          queues.slowDiscover.enqueue({ parentId: post.id, url: href});
        } else {
          log.trace("Parsed relative url " + util.inspect(parsedUrl));

          //If we have real path info or a real query, try to resolve the url
          if(parsedUrl.pathname || parsedUrl.query) {
            var resolvedUrl = url.resolve(post.uri, href);
            log.debug("Created resolved url " + resolvedUrl);

            addLink(post.id, resolvedUrl);

            queues.slowDiscover.enqueue({ parentId: post.id, url: resolvedUrl});
          }
        }
      });
    });

    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(post.content);
  } catch (e) {
    log.error("Error while extracting links: " + util.inspect(e));
  }
}

function addLink(postId, url)
{
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
