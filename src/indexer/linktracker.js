var _ = require('underscore');
var util = require('util');
var dataLayer = require('../core/datalayer');
var queues = require('../core/resque-queues');
var htmlparser = require('htmlparser');
var select = require('soupselect').select;

// TODO try to identify and longify tiny URLs
function extractLinks(html) {

  var handler = new htmlparser.DefaultHandler(function (err, dom) {
    if (err) {
      throw err;
    }
    // might want to directly reference the attribs instead of just links
    var links = select(dom, 'a');
    var attribs = _.pluck(links, "attribs");
    var hrefs = _.pluck(_.compact(attribs), "href");

    _.each(hrefs, function(href) {
      log.info("Enqueing discover job for href " + href);
      queues.fastDiscover.enqueue({ url: href });
    });
  });

  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(html);
}

exports.processPostContent = function (postContent) {
  return extractLinks(postContent);
}
