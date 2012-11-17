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
          if ('attribs' in link && 'href' in link.attribs) {
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
    });
    
    // TODO: add back validator so that we can leverage blacklist!
    // Need to find a performant one-pass way of doing this, ideally for links in bulk
    // Maybe just validate before throwing to discoverer... fire and forget may give a nice boost

    /*** query building stuff **/

    // the templatized fields we'll be using in our prepared statement..
    var fields = ['uri', 'from_uri', 'link_text'];
    
    // the count of records we've build a query for (used for computing offsets)
    var record_num = 0;

    // generate the values: ($1, $2, $3, now(), now()), ($4, $5, $6, now(), now())
    var prepared_links = _.map(links, function(link) {
      return "(" + _.map(field, function(field, index) {
        return "$" + ((index + 1) + (record_num * fields.length));
      }).concat(['now()', 'now()']).join(', ') + ")";
    }).join(', ');

    // build up actual final query
    var query = "INSERT INTO links (uri, from_uri, link_text, created_at, updated_at) VALUES " + prepared_links;  

    // generate the array of arguments to the prepared statement
    var prepared_arguments = _.flatten(
      _.map(links, function(link) {
        return [link.href, article.link, link.text];
      })
    );

    // run the query, inserting all of the links we found in this post
    dbClient.query(query, prepared_arguments, function(err, result) {
      if(err) {
        log.fatal("Error running query: " + err);
        log.fatal(query);
        log.fatal(util.inspect(prepared_arguments));
        throw err;
      }

      // say we're done, no error
      callback(null);

    });
  });

  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(article.contents);
}

exports.processPostContent = function (post, callback) {
  return extractLinks(post, callback);
}
