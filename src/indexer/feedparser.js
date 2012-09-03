var NodePie = require('nodepie');
var dataLayer = require('../core/datalayer');
var linkTracker = require('./linktracker');
var _ = require('underscore');
var Step = require('step');
var util = require('util');


function updateSourceMetadata(source, parser, indexTime, updated, done) {
  var updateFields = new Object();

  if (parser.getDescription() && source.description != parser.getDescription()) {
    updateFields.description = parser.getDescription();
  }

  // TODO handle PubSubHubBub
  
  if (parser.getTitle() && source.title != parser.getTitle()) {
    updateFields.title = parser.getTitle();
  } else if (!source.title) { // title isn't set and the source didn't provide it
    updateFields.title = "[Source " + source.id + "]";
  }

  // TODO handle permalink
  
  updateFields.indexed_at = indexTime;
  var nextIndexTime = new Date(indexTime);
  nextIndexTime.setMinutes(nextIndexTime.getMinutes() + source.index_interval);
  updateFields.next_index_at = nextIndexTime;

  // TODO tweak source.index_interval depending on whether or not we got updates, so that it homes in on the correct update frequency for this feed

  if (updated) {
    updateFields.new_content_at = indexTime;
  }
  
  log.debug("Updating source " + source.id + ": " + util.inspect(updateFields));
  dataLayer.Source.update(source.id, updateFields, done);
}

/** updates the existing post with the content if it finds it
 * @param callback  error or result.  result is the post ID if one was found/updated, or false if none was found
 */
function updateExistingPost(post, source, indexTime, callback) {
  // TODO handle multiple versions of a single post
  dataLayer.Post.findOne({
    uri: post.getPermalink() // TODO improve this to be a little less draconian... we may want it to match if the trailing slash is omitted, or if the leading http:// is missing, or a whole bunch of things
  },
  function(err, result) {
    if (err) {
      callback(new Error("Error while finding existing post: " + err.message));
    } else if (result) { // NOTE this section will not execute until we fix the code in checkForUpdatedPosts() to actually give us updated posts instead of only new ones
      var updateFields = {};

      if (post.getContents() && result.content != post.getContents()) {
        updateFields.content = post.getContents();
      }

      if (post.getDescription() && result.description != post.getDescription()) {
        updateFields.description = post.getDescription();
      }

      if (post.getTitle() && result.title != post.getTitle()) {
        updateFields.title = post.getTitle();
      }

      if (post.getPermalink() && result.uri != post.getPermalink()) {
        updateFields.uri = post.getPermalink();
      }

      if (post.getAuthor() && result.author != post.getAuthor()) {
        updateFields.author = post.getAuthor();
      }

      if (result.source_id != source.id) { // TODO maybe we should only change this if it is NULL?  in case the same article appears in multiple feeds
        updateFields.source_id = source.id;
      }

      if (!_.isEmpty(updateFields)) {
        updateFields.indexed_at = indexTime;
        
        // TODO if we're going to be tracking edits to articles, we might want to archive the old version in another table

        dataLayer.Post.update(result.id, updateFields, function(err, result) {
          if (err) {
            //log.error("updateExistingPost error: " + err.message + "\npost title: " + post.getTitle() + "\nerror details: " + util.inspect(err));
            callback(err);
          } else {
            //console.log("result: " + util.inspect(result));
            callback(null, result.id);
          }
        });
      } else {
        callback(null, result.id);
      }
    } else {
      callback(null, false);
    }
  });
}

/**
 * @param source  the source object from which these posts come
 * @param updatedPosts  an array of parser objects which represent the new/updated posts.  this array may not be empty
 * @param done  callback
*/
function createOrUpdatePosts(source, indexTime, updatedPosts, done) {
  Step(
    function() {
      var group = this.group();
      _.each(updatedPosts, function(post) {
        // TODO can this be made to use Step's parallel() function for greater efficiency?
        var callback = group(); // instantiate this here because we need to do it synchronously and the function where it is used is asynchronous

        updateExistingPost(post, source, indexTime, function(err, postContentsId) {
          if (err) {
            callback(err)
            return;
          }

          if (postContentsId === false) { // existing post wasn't found
            log.info("Identified post to crawl for links");

            var postContent = {
              content: post.getContents(),
              description: post.getDescription(),
              source_id: source.id,
              title: post.getTitle(),
              uri: post.getPermalink(),
              author: post.getAuthor(),
              published_at: post.getDate(),
              indexed_at: indexTime
            }

            dataLayer.Post.create(postContent, function(err, postCreated) {
              log.trace("Added post to database, checking for internal links");

               if(err) {
                callback(err);
                return;
              }

              // Since we're doing an insert, we only expect 1 result: rows[0]
              linkTracker.processPostContent(postCreated.rows[0]);
            }); 

            // TODO perhaps this callback isn't returning the object we 
            // expect as the results... not important since we're 
            // not using it right now
          } else {
            callback(null, postContentsId);
          }
        });
      });
    },
    done
  );
}

// callback takes an array of the items that were updated
function checkForUpdatedPosts(source, parser, callback) {

  Step(
    function readPosts() {
      dataLayer.Post.find(
        {
          "uri.in": _.map(parser.getItems(), function(item) { return item.getPermalink(); })
        },
        {
          only: [ 'id', 'uri', 'source_id' ],
        },
        this);
    },
    function findUpdated(err, results) {
      if (err) {
        //console.log("findUpdated error" + err.message);
        throw err;
      }
      
      log.debug("Found " + results.length + " existing posts matching URIs");
      // TODO we can probably improve this from O(n^2) to O(nlogn) by building
      // a hash of URIs

      var updatedItems = _.reject(parser.getItems(), function (item) {
        return _.find(results, function(postWithContent) {
          // TODO check for updates as well as just new ones.  basing it just on the URI like we're doing currently means updateExistingPost() will always return false
          return postWithContent.uri == item.getPermalink();
        });
      });

      log.info("Found " + updatedItems.length + " updated item(s) for source " + source.id);
      return updatedItems;
    },
    callback
  );
}

function parseFeed(source, xml, done) {
  try {
    log.debug("Parsing source " + source.id);

    var indexTime = new Date();

    var parser = new NodePie(xml, {keepHTMLEntities: true});
    parser.init();

    checkForUpdatedPosts(source, parser, function(err, updatedPosts) {
      if (err) {
        done(err);
      } else {
        Step(
          function() {
            var group = this.group();

            if (updatedPosts.length > 0) {
              createOrUpdatePosts(source, indexTime, updatedPosts, group());
            }

            updateSourceMetadata(source, parser, indexTime, (updatedPosts.length > 0), group());
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
