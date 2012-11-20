var FeedParser = require('feedparser');
var dataLayer = require('../core/datalayer');
var linkTracker = require('./linktracker');
var _ = require('underscore');
var util = require('util');
var graphDatalayer = require('../core/graph-datalayer');

// NOTE: Throughout this file, 'post' refers to the post in the database, and 'article' refers to the article parsed from the external feed

function parseFeed(source, xml, done) {
  try {
    log.debug("Parsing source " + source.id);

    var indexTime = new Date();

    var parser = new FeedParser();
    parser.parseString(xml, function(err, metadata, articles) {
      if(err) {
        done(err);
        return;
      }

      var articles = _.reject(articles, function(article) { return !article.link; });
      if(articles.length > 0) {
        // Insert any new posts
        createNewPosts(source, articles, function(err, result) {

          // TODO: update source metadata
          
          log.info("Indexed " + articles.length + "articles");

          if(!result || result.rows.length <= 0) {
            done(null, []);
            return;
          }
          
          log.debug("Indexed " + result.rows.length + " new posts!");

          // for each article that we created, exctract links
          var processed_articles = 0;
          var created_uris = _.pluck(result.rows, 'uri');
          _.each(
            _.filter(articles, function(article) {
              return _.contains(created_uris, article.link);
            }),
          function(article) {
            linkTracker.processPostContent(article, function() {  
              processed_articles++;
              if(processed_articles >= created_uris.length) {
                done(null, created_uris);
              }
            });
          });

        });
      } else {
        done(null, []);
      }

    });
  } catch (e) {
    done(e);
  }
}

function createNewPosts(source, articles, callback) {

  if(articles.length <= 0) {
    callback(null);
  }

  graphDatalayer.getClient(function(err, db) {
    if(err) {
      log.fatal(err);
      throw err;
    }
    var pages_created = 0;
    _.each(articles, function(article) {
      db.command("CREATE VERTEX SET uri = '" + article.link + "'", function(err, results) {
        if(err) {
          log.fatal("Error running command: " + err);
          throw err;
        }
        pages_created++;
        article.rid = results[0]['@rid'];
        if(pages_created >= articles.length) {
          callback(null, articles);
        }
      });
    });
  });

}

/** Source updating helpers **/

function updateSourceMetadata(source, metadata, indexTime, updated, done) {
  var updateFields = {};

  if (metadata.description && source.description != metadata.description) {
    updateFields.description = metadata.description;
  }

  // TODO handle PubSubHubBub
  
  if (metadata.title && source.title != metadata.title) {
    updateFields.title = metadata.title;
  } else if (!source.title) { // title isn't set and the source didn't provide it
    updateFields.title = "[Source " + source.id + "]";
  }

  if (metadata.date) {
    updateFields.last_published_at = metadata.date;
  } // TODO do we want to set this to a local timestamp if the feed doesn't provide it?

  // TODO handle permalink

  if (updated) {
    updateFields.unique_content_at = indexTime;
  }

  updateFields.indexed_at = indexTime;
  updateFields.index_interval = calculateIndexInterval(source.index_interval, updated);
  updateFields.next_index_at = calculateNextIndexTime(updateFields.index_interval, indexTime);

  updateFields.failure_count = 0; // reset failure count since we had a successful parse
  
  log.debug("Updating source " + source.id + ": " + util.inspect(updateFields));
  dataLayer.Source.update(source.id, updateFields, done);
}

function calculateIndexInterval(indexInterval, updated) {
  if (updated) {
    // tweak index_interval to go a little faster since we got new content
    return Math.max(Math.round(indexInterval * 0.9), settings.indexer.minIndexInterval);
  } else {
    // tweak index_interval to go a little slower since there was no new content
    return Math.min(Math.round(indexInterval * 1.1), settings.indexer.maxIndexInterval);
  }
}

function calculateNextIndexTime(indexInterval, indexTime) {
  var nextIndexTime = new Date(indexTime);
  nextIndexTime.setSeconds(nextIndexTime.getSeconds() + indexInterval);
}


/** Exports **/
exports.parseFeed = parseFeed;
