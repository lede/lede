var _ = require('underscore');
var util = require('util');
var dataLayer = require('../core/datalayer');
var validator = require('../core/validator');
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
      var anchors = select(dom, 'a');
      //log.info(util.inspect(links[0]));
      links = _.compact(_.map(anchors, function(link) {
        if ('attribs' in link && 'href' in link.attribs) {
          return { text: link.children[0].data, href: link.attribs.href };
        } else {
          return null;
        }
      }));
      /*var attribs = _.pluck(links, "attribs");
      var hrefs = _.pluck(_.compact(attribs), "href");
      hrefs = _.compact(hrefs);*/

      _.each(links, function(link) {
        var parsedUrl = url.parse(link.href);
        var resolvedUrl = link.href;

        // detect relative urls by seeing if the url has a host
        if(! parsedUrl.hostname) {
          log.debug("Parsed relative url " + util.inspect(parsedUrl));

          //If we have real path info or a real query, try to resolve the url
          if(parsedUrl.pathname || parsedUrl.query) {
            log.debug("Created resolved url " + resolvedUrl);
            resolvedUrl = url.resolve(post.uri, link.href);
          } else {
            log.debug("Failed to resolve url " + link.href);
            resolvedUrl = null;
          }
        }

        // Check for not http(s) protocols, this handles javascript: and mailto: 
        if (url.parse(resolvedUrl).protocol != 'http:' && url.parse(resolvedUrl).protocol != 'https:') {
          log.debug("Detected link to non http(s) with " + resolvedUrl);
          resolvedUrl = null;
        }

        validator.checkUrlValid(resolvedUrl, function(isValid) {
          if(isValid) {
            log.info("Adding link from post " + post.id + ' to ' + resolvedUrl );
            addLink(post.id, link.text, resolvedUrl);
            log.debug("Enqueing discover job for url " + resolvedUrl);
            queues.slowDiscover.enqueue({ parentId: post.id, url: resolvedUrl});
          } else {
            log.info("URL "+ resolvedUrl +" has been tossed from indexer by blacklist, not trying to enqueue");
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

function addLink(postId, linkText, url) {
  var linkContent = {
    from_post_id: postId,
    link_text: linkText,
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
