settings = require('../core/settings').get("");
log = require('../core/logger').getLogger("validator");
var url = require('url');
var util = require('util');
var dataLayer = require('./datalayer');
var _ = require('underscore');


function Blacklist() {

  var blacklist = [];

  // return the blacklist from cache if available, 
  // else come back with the latest data from the datalayer
  this.get = function (cb) {
    if (blacklist.length > 0) {
      log.debug("getting blacklist from cache");
      cb(blacklist);
    } else {
      log.debug("geting blacklist from database");
      dataLayer.Blacklist.find({},{only: ['id', 'url']}, function(err, result) {
        if(err) {
          log.error(err.message);
          return;
        } else if (result) {
          blacklist = result;
          cb(blacklist);
        }
      });
    }
  };

  // Invalidate the cache, next call to get has latest data
  this.invalidate = function () {
    blacklist = [];
  };

}

// checks if a url is valid
function checkUrlValid(url, callback) {
  var bl = new Blacklist();

  // If we have a blacklist match, the url is invalid
  bl.get(function(list) {
    if( _.any(list, function(listItem) { return listItem.url == url }) ) {
      callback(false);
    } else {
      callback(true);
    }
  });
}

// tester for checkUrlValid
checkUrlValid('simeo.com', function(isValid) {
  log.info('Test for valid URL: ' + isValid + ' expects: true');
});
checkUrlValid('vimeo.com', function(isValid) {
  log.info('Test for invalid URL: ' + isValid + ' expects: false');
});

exports.checkUrlValid = checkUrlValid;
