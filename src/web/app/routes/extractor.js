var User = require('../../../core/datalayer').User;
var Extractor = require('../../../indexer/extractor');
var no_err = require('../helpers/core').no_err;
var crypto = require('crypto');
var log = require('../../../core/logger').getLogger("web");
var _ = require('underscore');
var util = require('util');

exports.extract = function(req, res) {
  Extractor.extractContent(req.body.url, function(err, extraction) {
    if(err) {
      log.error(err);
      res.status(500);
      res.send({message: err});
    } else if (extraction) {
      res.send(extraction);
    }
  });
};

exports.createThumbnail = function(req, res) {
  if(!req.body.url) {
    res.status(200);
    res.end();
    return;
  }

  Extractor.createThumbnail(req.body.url, function(err, image) {
    if(err) {
      log.error(err);
      res.status(500);
      res.send({message: err});
    } else if (image) {
      //explicitly only send the url, since the path is private info
      res.send({url: image.url});
    }
  });
};
