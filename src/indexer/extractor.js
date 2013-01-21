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
var urlParser = require('url');

function extractContent(url, done) {
  http.get(url, function(err, result) {
    if (err) {
      done(err);
    } else {
      extractContentFromHtml(result.buffer, result.url || url, done);
    }
  });
}

/** extract the content from the web page, using some basic heuristics and metadata to figure out which parts are the parts that we seek.
 * @param siteBody  the raw response content of the web page
 * @param baseUrl  the URL of the web page, used to resolve relative links
 * @param done  the callback.  the result object contains properties for 'title', 'image' and 'description'.
 */
function extractContentFromHtml(siteBody, baseUrl, done) {
  try {
    var parser = new htmlparser.Parser(new htmlparser.DefaultHandler(function(err, dom) {
      if (err) {
        log.error("error: " + util.inspect(err));
        done(err);
      } else {
        var result = {
          image: extractImage(dom, baseUrl),
          title: decodeHtml(extractTitle(dom)),
          description: decodeHtml(extractDescription(dom))
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

/** extract a representative image from the DOM
 * @param dom the DOM to search
 * @param baseUrl the URL of the page that the DOM came from, so that we can resolve relative URLs to images
 * @return a fully-qualified URL to an image
 */
function extractImage(dom, baseUrl) {
  // TODO handle <base> tag which changes the base URL
 
  var imageUrl = extractImageTag(dom);

  var parsedUrl = urlParser.parse(imageUrl);

  if (parsedUrl.host) {
    log.trace('image URL is absolute');
    return imageUrl;
  } else if (parsedUrl.pathname || parsedUrl.query) {
    log.trace('resolving relative image URL');
    return urlParser.resolve(baseUrl, imageUrl);
  } else {
    log.debug("unable to resolve relative URL");
    return null;
  }
}

function extractImageTag(dom) {
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
    return e.children;
  });

  if (titleTags.length) {
    log.debug("using title tag");
    return flattenHtml(titleTags[0]);
  }
  
  // h1
  var h1Tags = _.filter(select(dom, "body h1"), function(e) {
    //log.info(util.inspect(e));
    return e.children;
  });

  if (h1Tags.length) {
    log.debug("using h1 tag");
    return flattenHtml(h1Tags[0]);
  }

  // h2
  var h2Tags = _.filter(select(dom, "body h2"), function(e) {
    return e.children;
  });

  if (h2Tags.length) {
    log.debug("using h2 tag");
    return flattenHtml(h2Tags[0]);
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
    return e.children;
  });

  if (pTags.length) {
    log.debug("using body P tag");
    return flattenHtml(pTags[0]);
  }
  
  // give up
  log.debug("unable to find description");
  return null;
}

function flattenHtml(element) {
  if (!element.children) {
    return "";
  }

  try {
    return _.reduce(element.children,
      function (memo, child) {
        if (child.type == 'text') {
          return memo + child.data;
        } else if (child.type == 'tag') {
          return memo + flattenHtml(child);
        } else {
          throw "unknown child element type: " + child.type;
        }
      },
      "");
  } catch (e) {
    log.error(e);
    return null;
  }
}

/** @brief reformat the image at the URL to fit our email format, which is 75x75 pixels.  this is not a very flexible function, but I figure we can generalize it later.  it then stores the image on disk
 * @param url  the absolute URL to the image to create a thumbnail of
 * @param done  the callback (err, result).  the result object contains two attributes, 'path', which is the absolute path on disk to the thumbnail, and 'url', which is the absolute URL at which the thumbnail can be accessed via the web.
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
        var outputLocation = {
          path: outputPath,
          url: urlParser.resolve(settings.domain, path.join(settings.extractor.thumbnailUrl, outputFileName))
        };
        done(err, outputLocation);
      });
    }
  });
}

function decodeHtml(html) {
  if (!_.isString(html)) { // can't sanitize non-strings...
    return html;
  }

  // decode HTML entities
  return encoder.htmlDecode(html);
}

exports.extractContent = extractContent;
exports.createThumbnail = createThumbnail;
exports.decodeHtml = decodeHtml;
