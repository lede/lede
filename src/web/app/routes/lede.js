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
  dataLayer.Story.findOne({ uri: uri }, { only: ['id', 'uri'] }, done);
}

/** creates a story (via extraction) from the given URL, or, if it is found to
 * already exist upon insert, it selects and returns the existing one.  you
 * probably don't want to call this directly, you want selectOrCreateStory().
 */
function extractAndUpdateStory(url, storyId, userId, done) {
  log.debug("Extracting content for story " + storyId);
  extractor.extractContent(url, function (err, content) {
    if (err) {
      log.error("While extracting story " + storyId + " at '" + url + "' for user " + userId + ": " + err);
      done(err);
    } else {
      dataLayer.Story.update(storyId, {
        title: content.title,
        description: content.description,
        author: content.author,
        image_url: content.image
      }, 
      function (err, numUpdatedRows) {
        if (err) {
          log.error("While updating story " + storyId + ": " + err);
          done(err);
        } else if (numUpdatedRows != 1) {
          done("Unable to update story " + storyId);
        } else {
          done(null, storyId);
        }
      });
    }
  });
}

/** create or find an existing story.  if we create, we also perform extraction as a separate step.  the params to done are (err, storyId)
 */
function createOrSelectStory(url, title, userId, done) {
  dataLayer.Story.create({
      uri: url,
      title: title,
      created_by_user_id: userId,
      origin_type: 1 // origin type 1 == bookmarklet click
    }, function(err, result) {
      if (err) {
        /* we check this to handle the race condition possibility if
         * someone else added this story in between when we selected for
         * it initially and when we tried to create it
         */
        if (/duplicate key value/.test(err)) {
          log.debug("Story at URI '" + url + "' already exists");
          selectStoryByUri(url, function(err, result) {
            if (err) {
              done(err);
            } else {
              done(null, result.id);
            }
          });
        } else {
          done(err);
        }
      } else {
        log.debug("Created story " + result.rows[0].id + " at URI '" + url + "'");
        extractAndUpdateStory(url, result.rows[0].id, userId, done);
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

    createOrSelectStory(canonicalUrl, req.query.title, req.user.id, function(err, storyId) {
      if (err) {
        log.error("While creating/selecting story '" + canonicalUrl + "': " + err);
      } else {
        createLedeToStory(req.user.id, storyId);
      }
    });
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
