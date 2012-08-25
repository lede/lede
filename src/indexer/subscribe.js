var _ = require('underscore');
var util = require('util');
var dataLayer = require('./datalayer');

function isSubscribed(folderId, feedId, callback) {
  dataLayer.Subscription.find(
    {
      "subscription_folder_id": folderId,
      "feed_id": feedId
    },
    { only: [ 'id' ] },
    function(err, result) {
      if (err) {
        callback(err);
      } else {
        log.trace("Folder " + folderId + " " + (result.length != 0 ? "DOES" : "DOES NOT") + " contain a subscription for feed " + feedId);
        callback(null, result.length != 0);
      }
    }
  );
}

function getDefaultFolder(userId, callback) {
  dataLayer.SubscriptionFolder.findOne(
    {
      user_account_id: userId,
      default_folder: true
    },
    { },
    callback);
}

// this is kinda a HACK... not sure if there is a better way.  it's somewhat safe, since it is restricted to the specific folder of this specific user, so there's no global race condition
function getNextUnusedDisplayOrder(folderId, callback) {
  dataLayer.Subscription.findOne(
    { "subscription_folder_id": folderId },
    { only: ["display_order"], order: ["-display_order"]},
    function(err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, result.display_order + 1);
      }
    }
  );
}

// folderId may be null, in which case it adds it to the default folder
function subscribe(userId, feedId, folderId, callback) {
  if (!folderId) {
    log.trace("Recursing subscribe due to missing folderId");
    getDefaultFolder(userId, function(err, result) {
      if (err) {
        callback(err);
      } else {
        subscribe(userId, feedId, result.id, callback);
      }
    });
    return;
  }

  log.trace("Checking to see if user " + userId + " is subscribed to feed " + feedId + " in folder " + folderId);

  isSubscribed(folderId, feedId, function (err, result) {
    if (err) {
      callback(err);
    } else if (result) {
      log.debug("User " + userId + " is already subscribed to feed " + feedId);
      callback(null);
    } else {
      log.debug("Creating new subscription for user " + userId + " to feed " + feedId);
      getNextUnusedDisplayOrder(folderId, function (err, result) {
        if (err) {
          callback(err);
        } else {
          dataLayer.Subscription.create({
            feed_id: feedId,
            subscription_folder_id: folderId,
            display_order: result
          },
          callback);
        }
      });
    }
  });
}

exports.isSubscribed = isSubscribed;
exports.subscribe = subscribe;
exports.getDefaultFolder = getDefaultFolder;
