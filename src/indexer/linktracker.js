var _ = require('underscore');
var util = require('util');
var dataLayer = require('../core/datalayer');
var Step = require('step');
var htmlparser = require('htmlparser');
var select = require('soupselect').select;

// TODO try to identify and longify tiny URLs
function extractLinks(html, callback) {
  var hrefs = [];
  var handler = new htmlparser.DefaultHandler(function (err, dom) {
    if (err) {
      throw err;
    }

    // might want to directly reference the attribs instead of just links
    var links = select(dom, 'a');
    var attribs = _.pluck(links, "attribs");
    hrefs = _.pluck(attribs, "href");
  });
  
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(html);
  return hrefs;
}

/** callback is passed a results object with two properties, 
 * "resolved" and "unresolved".  The former is a list of post_content_ids 
 * for resolved links, the latter is a list of unresolved URLs
 * @param links a list of URLs
 */
function resolveLinks(links, callback) {

}

function insertResolvedLinks(postContentId, links, callback) {
}

function insertUnresolvedLinks(postContentId, links, callback) {
}

function resolveUnresolvedLinks(uri, postContentId, callback) {
}

exports.processPostContent = function (postContent, callback) {
  Step(
    function() {
      return extractLinks(postContent.contents, this);
    },
    function(err, result) {
      if (err) {
        throw err;
      }

      resolveLinks(result, this.parallel());
      resolveUnresolvedLinks(postContent.uri, postContent.id, this.parallel());
    },
    function(err, outgoingLinksResult, incomingLinksResult) {
      if (err) {
        throw err;
      }

      var outgoingLinksForInsert = _.map(outgoingLinksResult.resolved, function(toPostContentId) {
        return { from_post_content_id: postContent.id, to_post_content_id: toPostContentId };
      });

      var incomingLinksForInsert = _.map(incomingLinksResult, function(incomingLink) {
        return { from_post_content_id: incomingLink.from_post_content_id, to_post_content_id: postContent.id };
      });

      var linksForInsert = outgoingLinksForInsert.concat(incomingLinksForInsert);

      var unresolvedLinksForInsert = _.map(outgoingLinksResult.unresolved, function() {
      });

      var unresolvedLinksForDelete = _.pluck(incomingLinksResult, "id");

      var group = this.group();

      if (linksForInsert.length > 0) {
        dataLayer.Link.create(linksForInsert, group());
      }

      if (unresolvedLinksForInsert.length > 0) {
        dataLayer.UnresolvedLink.create(unresolvedLinksForInsert, group());
      }

      if (unresolvedLinksForDelete.length > 0) {
        dataLayer.UnresolvedLink.destroy(unresolvedLinksForDelete, group());
      }
    },
    function(err, result) {
      if (err) {
        throw err;
      }
    },
    function(err, result) {
      if (err) {
        throw err;
      }
    },
    callback
  );
}
