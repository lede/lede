var NodePie = require('nodepie');
var dataLayer = require('../core/datalayer');
var _ = require('underscore');
var Step = require('step');
var util = require('util');

function updateFeedMetadata(feed, parser, indexTime, updated, done) {
  var updateFields = new Object();

  if (parser.getDescription() && feed.description != parser.getDescription()) {
    updateFields.description = parser.getDescription();
  }

  // TODO handle PubSubHubBub
  
  if (parser.getTitle() && feed.title != parser.getTitle()) {
    updateFields.title = parser.getTitle();
  } else if (!feed.title) { // title isn't set and the feed didn't provide it
    updateFields.title = "[Source " + feed.id + "]";
  }

  // TODO handle permalink
  
  updateFields.indexed_at = indexTime;

  if (updated) {
    updateFields.new_content_at = indexTime;
  }
  
  log.debug("Updating feed " + feed.id + ": " + util.inspect(updateFields));
  dataLayer.Source.update(feed.id, updateFields, done);
}

function updatePostContents(parser, item, callback) {
  // TODO handle multiple versions of a single post
  dataLayer.PostContent.find({
    uri: item.getPermalink() // TODO improve this to be a little less draconian... we may want it to match if the trailing slash is omitted, or if the leading http:// is missing, or a whole bunch of things
  },
  function(err, result) {
    if (err) {
      callback(new Error("updatePostContents error while finding existing post: " + err.message));
    } else if (result.length > 0) {
      callback(null, result[0].id);
    } else {
      dataLayer.PostContent.create({
        content: item.getContents(),
        description: item.getDescription(),
        title: item.getTitle(),
        uri: item.getPermalink()
      },
      function(err, result) {
        if (err) {
          //log.error("updatePostContents error: " + err.message + "\nitem title: " + item.getTitle() + "\nerror details: " + util.inspect(err));
          callback(err);
        } else {
          //console.log("result: " + util.inspect(result));
          callback(null, result.rows[0].id);
        }
      });
    }
  });
}

// assumes function will never be called with an empty list for updatedPosts
function updatePosts(feed, parser, updatedPosts, done) {
  Step(
    function() {
      var group = this.group();
      _.each(updatedPosts, function(item) {
        var callback = group(); // instantiate this here because we need to do it synchronously and the function where it is used is asynchronous

        updatePostContents(parser, item, function(err, postContentsId) {
          if (!err) {
            dataLayer.Post.create({
              // TODO add more
              feed_id: feed.id,
              post_content_id: postContentsId,
              published_at: item.getDate()
            },
            callback);
          } else {
            callback(err);
          }
        });
      });
    },
    done
  );
}

// callback takes an array of the items that were updated
function checkForUpdatedPosts(feed, parser, callback) {

  Step(
    function readPosts() {
      dataLayer.PostWithContent.find(
        {
          "uri.in": _.map(parser.getItems(), function(item) { return item.getPermalink(); }),
          "feed_id": feed.id
        },
        {
          only: [ 'post_id', 'uri', 'post_content_id', 'feed_id' ],
        },
        this);
    },
    function findUpdated(err, results) {
      if (err) {
        //console.log("findUpdated error" + err.message);
        throw err;
      }
      
      //log.trace("found posts: " + util.inspect(results, false, 3));
      log.debug("found " + results.length + " existing posts matching URI");
      // TODO we can probably improve this from O(n^2) to O(nlogn) by building
      // a hash of URIs

      var updatedItems = _.reject(parser.getItems(), function (item) {
        return _.find(results, function(postWithContent) {
          // TODO check for updates as well as just new ones
          return postWithContent.uri == item.getPermalink();
        });
      });

      log.info("Found " + updatedItems.length + " updated item(s) for feed " + feed.id);
      return updatedItems;
    },
    callback
  );
}

function parseFeed(feed, xml, done) {
  try {
    log.debug("parsing feed " + feed.id);

    var indexTime = new Date();

    var parser = new NodePie(xml, {keepHTMLEntities: true});
    parser.init();

    checkForUpdatedPosts(feed, parser, function(err, updatedPosts) {
      if (err) {
        done(err);
      } else {
        Step(
          function() {
            var group = this.group();

            if (updatedPosts.length > 0) {
              updatePosts(feed, parser, updatedPosts, group());
            }

            updateFeedMetadata(feed, parser, indexTime, (updatedPosts.length > 0), group());
          },
          done
        );
      }
    });
  } catch (e) {
    done(e);
  }
}

exports.parseFeed = parseFeed;
