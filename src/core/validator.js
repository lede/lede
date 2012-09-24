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

function checkUrlValid(url, callback) {
  var bl = new Blacklist();

  bl.get(function(list) {

    //TODO: consider generating and caching the regexps once per cache-warm
    //      also consider some smarter way of churning through blacklist
    var isBlacklisted =  _.any( list, function(listItem) {
      var re = new RegExp (listItem.url);
      return re.test(url) 
    }); 

    if(isBlacklisted) {
      callback(false);
    } else {
      callback(true);
    }
  });
}

exports.checkUrlValid = checkUrlValid;
