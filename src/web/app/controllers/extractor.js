var User = require('../../../core/datalayer').User;
var Extractor = require('../../../indexer/extractor');
var no_err = require('../helpers/core').no_err;
var crypto = require('crypto');
var log = require('../../../core/logger').getLogger("web");
var _ = require('underscore');
var util = require('util');

exports.extract = function(req, res) {
  Extractor.extractContent(req.body.uri, function(err, extraction) {
    if(err) {
      res.status(500);
      res.send({message: 'Extraction has failed'});
    } else if (extraction) {
      log.info(extraction);
      res.send(extraction);
    }
  });
};

exports.reformatImage = function(req, res) {
  Extractor.reformatImage(req.body.uri, function(err, imageUri) {
    if(err) {
      res.status(500);
      res.send({message: 'Extraction has failed'});
    } else if (extraction) {
      log.info(extraction);
      res.send(extraction);
    }
  });
};
