// this library is meant to extract a headline, article text, and a
// representative image from a raw web page, for use when there is no RSS feed
// available

var util = require('util');
var _ = require('underscore');
var htmlparser = require('htmlparser');
var select = require('soupselect').select;
var http = require('http-get');
var gm = require('gm');
var path = require('path');
var uuid = require('node-uuid');
var encoder = new require('node-html-encoder').Encoder('entity');

function extractContent(url, done) {
  http.get(url, function(err, result) {
    if (err) {
      done(err);
    } else {
      extractContentFromHtml(result.buffer, done);
    }
  });
}

/** extract the content from the web page, using some basic heuristics and metadata to figure out which parts are the parts that we seek.  the result object contains properties for 'title', 'image' and 'description'.
 */
function extractContentFromHtml(siteBody, done) {
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
  var imgPTags = select(dom, "body p img");

  if (imgPTags.length) {
    log.debug("using image tag in paragraph in body");
    return imgPTags[0].attribs.src;
  }

  // first image tag inside the body 
  var imgTags = select(dom, "img");

  log.debug("img: " + util.inspect(imgTags));

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

  // title tag
  var titleTags = _.filter(select(dom, "head title"), function(e) {
    return findFirstTextChild(e);
  });

  if (titleTags.length) {
    log.debug("using title tag");
    return findFirstTextChild(titleTags[0]).data;
  }
  
  // h1
  var h1Tags = _.filter(select(dom, "body h1"), function(e) {
    //log.info(util.inspect(e));
    return findFirstTextChild(e);
  });

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
    return c.type == 'text' && c.data != "";
  });

  return textChildren.length ? textChildren[0] : null;
}

/** @brief reformat the image at the URL to fit our email format, which is 75x75 pixels.  this is not a very flexible function, but I figure we can generalize it later.  it then stores the image somewhere and the result will be a key to that store (probably a relational DB).
 */
function createThumbnail(url, done) {
  http.get({ url: url, bufferType: 'buffer' }, function(err, result) {
    if (err) {
      done(err);
    } else {
      var outputFileName = uuid.v1() + path.extname(url);
      var outputPath = path.resolve(settings.ledeHome, settings.extractor.thumbnailPath, outputFileName);
      log.debug('thumbnail output path: ' + outputPath);
      gm(result.buffer, url).thumb(settings.extractor.thumbnailWidth, settings.extractor.thumbnailHeight, outputPath, 100, 'center', function (err) {
        done(err, outputFileName);
      });
    }
  });
}

function stripAndDecodeHtml(html) {
  // strip HTML tags, suggested by http://stackoverflow.com/a/822464/10861
  html = html.replace(/<(?:.|\n)*?>/gm, '');

  // decode HTML entities
  return encoder.htmlDecode(html);
}

exports.extractContent = extractContent;
exports.createThumbnail = createThumbnail;
exports.stripAndDecodeHtml = stripAndDecodeHtml;
