// this library is meant to extract a headline, article text, and a
// representative image from a raw web page, for use when there is no RSS feed
// available

var util = require('util');
var _ = require('underscore');
var htmlparser = require('htmlparser');
var select = require('soupselect').select;

/** extract the content from the web page, using some basic heuristics and metadata to figure out which parts are the parts that we seek.  the result object contains properties for 'title', 'image' and 'description'.
 */
function extractContent(siteBody, done) {
  try {
    var parser = new htmlparser.Parser(new htmlparser.DefaultHandler(function(err, dom) {
      if (err) {
        log.error("error: " + util.inspect(err));
        done(err);
      } else {
        var result = {
          image: extractImage(dom),
          title: extractTitle(dom),
          description: extractDescription(dom)
        };

        done(null, result);
      }
    }));
    log.trace("Built parser");
    parser.parseComplete(siteBody);
  } catch (e) {
    log.error("error caught: " + util.inspect(e));
    done(e);
  }  
}

function extractImage(dom) {
  // TODO resolve relative URLs?

  // parse Facebook Open Graph image meta tag
  var ogImageMetas = _.filter(select(dom, "head meta"), function(e) {
    return /og:image/i.test(e.attribs.property);
  });

  if (ogImageMetas.length) {
    log.debug("using OG image meta");
    return ogImageMetas[0].attribs.content;
  }

  // parse image_src meta tag
  var imageSrcLinks = _.filter(select(dom, "head link"), function(e) {
    return /image_src/i.test(e.attribs.type);
  });

  if (imageSrcLinks.length) {
    log.debug("using image_src meta");
    return imageSrcLinks[0].attribs.content;
  }

  // first image tag inside the body paragraph
  var imgTags = select(dom, "body p img");

  if (imgTags.length) {
    log.debug("using image tag in body");
    return imgTags[0].attribs.src;
  }

  // give up
  log.debug("unable to find image");
  return null;
}

function extractTitle(dom) {
  // parse Facebook Open Graph title meta tag
  var ogTitleMetas = _.filter(select(dom, "head meta"), function(e) {
    return /og:title/i.test(e.attribs.property);
  });

  if (ogTitleMetas.length) {
    log.debug("using OG title meta");
    return ogTitleMetas[0].attribs.content;
  }
  
  // h1
  var h1Tags = _.filter(select(dom, "body h1"), function(e) {
    log.info(util.inspect(e));
    return findFirstTextChild(e);
  });

  log.info("tags object: " + util.inspect(h1Tags));
  if (h1Tags.length) {
    log.debug("using h1 tag");
    return findFirstTextChild(h1Tags[0]).data;
  }

  // h2
  var h2Tags = _.filter(select(dom, "body h2"), function(e) {
    return findFirstTextChild(e);
  });

  if (h2Tags.length) {
    log.debug("using h2 tag");
    return findFirstTextChild(h2Tags[0]).data;
  }
  
  // give up
  log.debug("unable to find title");
  return null;
}

function extractDescription(dom) {
  // parse Facebook Open Graph description meta tag
  var ogDescriptionMetas = _.filter(select(dom, "head meta"), function(e) {
    return /og:description/i.test(e.attribs.property);
  });
  
  if (ogDescriptionMetas.length) {
    log.debug("using OG desc meta");
    return ogDescriptionMetas[0].attribs.content;
  }
  
  // first P tag of the body
  var pTags = _.filter(select(dom, "body p"), function(e) {
    return findFirstTextChild(e);
  });

  if (pTags.length) {
    log.debug("using body P tag");
    return findFirstTextChild(pTags[0]).data;
  }
  
  // give up
  log.debug("unable to find description");
  return null;
}

function findFirstTextChild(element) {
  if (!element.children) {
    return null;
  }

  var textChildren = _.filter(element.children, function(c) {
    return c.type == 'text';
  });

  return textChildren.length ? textChildren[0] : null;
}

exports.extractContent = extractContent;
