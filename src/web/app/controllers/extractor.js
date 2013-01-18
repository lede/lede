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
      res.status(500);
      res.send({message: err});
    } else if (extraction) {
      res.send(extraction);
    }
  });
};

exports.createThumbnail = function(req, res) {
  Extractor.createThumbnail(req.body.url, function(err, imageUri) {
    log.info("Got to the callback");
    if(err) {
      log.error(err);
      res.status(500);
      res.send({message: err});
    } else if (imageUri) {
      res.send(imageUri);
    }
  });
};
