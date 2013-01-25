// this library is meant to extract a headline, article text, and a
// representative image from a raw web page, for use when there is no RSS feed
// available.  many of the meta tags used below are recommended by
// http://www.webmarketingnow.com/tips/meta-tags-uncovered.html, and I believe
// they should be promoted as a real standard

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
          description: decodeHtml(extractDescription(dom)),
          author: decodeHtml(extractAuthor(dom))
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
  
  if (!imageUrl) {
    return null;
  }

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
  var extractors = [
    new FirstMetaByNameExtractor('thumbnail'), // this is something I want to push as a pseudo-standard
    new FirstMetaByPropertyExtractor('og:image'), // Facebook
    new FirstLinkByRelExtractor('image_src'),
    new FirstImgExtractor('body p img'),
    new FirstImgExtractor('body img')
  ];

  return findFirstInDom(dom, extractors, 'image');
}

function extractTitle(dom) {
  var extractors = [
    new FirstMetaByNameExtractor('title'), // recommended but nonstandard
    new FirstMetaByPropertyExtractor('og:title'), // Facebook
    new FirstTagWithChildrenExtractor('head title'),
    new FirstTagWithChildrenExtractor('body h1'),
    new FirstTagWithChildrenExtractor('body h2')
  ];

  return findFirstInDom(dom, extractors, 'title');
}

function extractDescription(dom) {
  var extractors = [
    new FirstMetaByNameExtractor('description'), // this is real
    new FirstMetaByPropertyExtractor('og:description'), // Facebook
    new FirstMetaByNameExtractor('abstract'), // recommended but nonstandard
    new FirstTagWithChildrenExtractor('body p')
  ];

  return findFirstInDom(dom, extractors, 'description');
}

function extractAuthor(dom) {
  var extractors = [
    new FirstMetaByNameExtractor('author'), // recommended but nonstandard
    new FirstMetaByPropertyExtractor('article:author') // Facebook
  ];

  return findFirstInDom(dom, extractors, 'description');
}

function FirstMetaByPropertyExtractor(propertyName) {
  this.find = function(dom) {
     return _.find(select(dom, "head meta"), function(e) {
      return new RegExp(propertyName, "i").test(e.attribs.property);
    });
  };

  this.extractValue = function (element) {
    return element.attribs.content;
  };

  this.description = "property=" + propertyName + " meta tag";
}

function FirstMetaByNameExtractor(name) {
  this.find = function(dom) {
     return _.find(select(dom, "head meta"), function(e) {
      return new RegExp(name, "i").test(e.attribs.name);
    });
  };

  this.extractValue = function (element) {
    return element.attribs.content;
  };

  this.description = "name=" + name + " meta tag";
}

function FirstLinkByRelExtractor(rel) {
  this.find = function(dom) {
     return _.find(select(dom, "head link"), function(e) {
      return new RegExp(rel, "i").test(e.attribs.rel);
    });
  };

  this.extractValue = function (element) {
    return element.attribs.content;
  };

  this.description = "link rel='" + rel + "' tag";
}

function FirstTagWithChildrenExtractor(selector) {
  this.find = function(dom) {
     return _.find(select(dom, selector), function(e) {
      return e.children;
    });
  };

  this.extractValue = function (element) {
    return flattenHtml(element);
  };

  this.description = selector + " tag";
}

function FirstImgExtractor(selector) {
  this.find = function(dom) {
     return _.find(select(dom, selector), function(e) {
      return e.attribs.src;
    });
  };

  this.extractValue = function (element) {
    return element.attribs.src;
  };

  this.description = selector + " tag";
}

function findFirstInDom(dom, extractors, desc) {
  for (var i = 0; i < extractors.length; ++i) {
    var e = extractors[i].find(dom);
    if (e) {
      log.debug("using " + extractors[i].description);
      return extractors[i].extractValue(e);
    }
  }

  log.debug("unable to find " + desc);
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
