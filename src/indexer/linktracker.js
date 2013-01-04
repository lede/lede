var _ = require('underscore');
var util = require('util');
var dataLayer = require('../core/datalayer');
var validator = require('../core/validator');
var queues = require('../core/resque-queues');
var htmlparser = require('htmlparser');
var select = require('soupselect').select;
var url = require('url');
var graphDatalayer = require('../core/graph-datalayer');
var stringFormat = require("util").format;

// TODO try to identify and longify tiny URLs and click-tracking URLs
function extractLinks(article, callback) {

  var handler = new htmlparser.DefaultHandler(function (err, dom) {
    if (err) {
      throw err;
    }

    // get the (reasonable looking and usable) links from the document
    links = 
    _.filter(
      _.compact(
        _.map(select(dom, 'a'), function(link) {
          if ('attribs' in link && 'href' in link.attribs && link.children && link.children[0]) {
            return { text: link.children[0].data, href: link.attribs.href };
          } else {
            return null;
          }
        })
      ), 

      // filter out malformed / unusable links
      function(link) {
        return !!url.parse(link.href).hostname && ( // check that this link isn't relative
          url.parse(link.href).protocol == 'http:' || url.parse(link.href).protocol == 'https:' // ensure we have a valide protocol
        );
      }
     );

    // short-circuit if we didn't find any useful links
    if(links.length <= 0) {
      log.debug("Found no links!");
      callback(null);
      return;
    }

    var processed_links = 0;

    // throw the links to the discoverer, add edges to graph db    
    // TODO: add back validator so that we can leverage blacklist!
    _.each(links, function(link) { 
      queues.slowDiscover.enqueue({ url: link.href }); 

      var query = "" + 
        "CREATE EDGE " +
        "FROM " + article.rid + " " +
        "TO (SELECT FROM Page WHERE uri = '" + link.href + "')";

      console.log("About to execute: " + query);

      graphDatalayer.query(query, function(err, results) {
        if(err) {
          log.fatal(err);
          throw err;
        }
        processed_links++;
        if(processed_links >= links.length) {
          callback(null);
        }
      });
    });

  });

  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(article.description);
}

exports.processPostContent = function (post, callback) {
  return extractLinks(post, callback);
}
