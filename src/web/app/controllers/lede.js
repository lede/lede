var dataLayer = require('../../../core/datalayer');
var _ = require('underscore');
var util = require('util');
var no_err = require('../helpers/core').no_err;
var path = require('path');
var queues = require('../../../core/resque-queues');
var query = require('./query');
var url = require('url');
var User = require('../../../core/datalayer').User;
var canonicalize = require('../../../core/canonicalize').canonicalize;
var extractor = require('../../../indexer/extractor');

function createLedeToStory(userId, storyId) {
  dataLayer.Lede.create({ user_id: userId, story_id: storyId }, function(err, result) {
    // yeah, it prints the results, and I'm sorry
    if (err) {
      log.error("While creating Lede to story " + storyId + " for user " + userId + ": " + err);
    } else {
      log.info("Finished processing Lede " + result.rows[0].id + " for user " + userId);
    }
  });
}

function selectStoryByUri(uri, done) {
  dataLayer.Story.find({ uri: uri }, { only: ['id', 'uri'] }, done);
}

/** creates a story (via extraction) from the given URL, or, if it is found to
 * already exist upon insert, it selects and returns the existing one.  you
 * probably don't want to call this directly, you want selectOrCreateStory().
 */
function createOrSelectStory(url, userId, done) {
  extractor.extractContent(canonicalUrl, function (err, content) {
    if (err) {
      log.error("While extracting bookmarklet URL '" + canonicalUrl + "' for user " + req.user.id + ": " + err);
      done(err);
    } else {
      dataLayer.Story.create({uri: canonicalUrl,
        title: content.title,
        description: content.description,
        author: content.author,
        image_url: content.image,
        created_by_user_id: req.user.id,
        origin_type: 1
      }, 
      function (err, storyResult) {
        if (err) {

          } else {
            log.error("While creating story from bookmarklet URL '" + canonicalUrl + "' for user " + req.user.id + ": " + err);
          }
        } else {
        }
      });
    }
  });
}

/** try to find an existing story, and if it doesn't exist, create it, then
 * we perform extraction for it as a separate step
 */
function selectOrCreateStory(url, title, userId, done) {
  selectStoryByUri(url, function(err, result) {
    if (err) {
      log.error("While finding bookmarklet story '" + url + "' for user " + userId + ": " + err);
      done(err);
    } else if (result.rows.length > 0) {
      done(null, result);
    } else {
      dataLayer.Story.create({ uri: url, title: title }, function(err, result) {
        if (err) {
          /* we check this to handle the race condition possibility if
           * someone else added this story in between when we selected for
           * it initially and when we tried to create it
           */
          if (/duplicate key value/.test(err)) {
            selectStoryByUri(url, done);
          } else {
            done(err);
          }
        } else {
          extractAndUpdateStory(storyId, done);
        }
      });
    }
  });
}

function createLede(req, res) {
  // clean this up, but:
  // ensure we have a valid request
  if(!req.query.target) {
    // invalid request, say so:
    log.warn("Malformed bookmarklet request from user " + req.user.id + ": " + util.inspect(req.query));
    res.send("var response = { success: false, message: 'Not all required request fields were present.' };");
    return;
  }

  // return the response to the user immediately, because our processing will
  // have noticeable lag (multiple requests to foreign servers)
  log.info("Bookmarklet request from user " + req.user.id + " for '" + req.query.target + "'");
  res.send("var response = { success: true };");

  canonicalize(req.query.target, function (err, canonicalUrl) {
    // attempt some discovery (don't pass parent id since there's no meaning to
    // it here and discoverer seems to ignore it anyway)
    // TODO we probably want to wrap this in a function that checks to see if
    // we've already performed discovery on this URL recently
    queues.fastDiscover.enqueue({ parentId: null, url: canonicalUrl });

    // extract that bitch
  });
}

exports.create = function(req, res) {
  createLede(req, res);
};

exports.list = function(req, res) {
  var tq = query.translate(req.query);
  dataLayer.Lede.find(tq.select, tq.attributes, no_err(res, function(results) {
    log.info("Listed Ledes for user " + req.user.id);
    res.send(results);
  }));

};
