var FeedParser = require('feedparser');
var request = require('request');
var dataLayer = require('../core/datalayer');
var linkTracker = require('./linktracker');
var _ = require('underscore');
var util = require('util');
var graphDatalayer = require('../core/graph-datalayer');
var Step = require('step');

// NOTE: Throughout this file, 'post' refers to the post in the database, and 'article' refers to the article parsed from the external feed

function parseFeed(source, done) {
  Step(
    function() {
      var group = this.group();

      var endEvent = group(); // create one event up front so we guarantee it doesn't advance to the next step before the end event fires
      
      request(source.url)
        .pipe(new FeedParser())
        .on('error', function(error) {
          done(error); // TODO wrap error in a descriptive object
        })
        .on('meta', function (meta) {
          // we process meta here instead of in the 'complete' event handler so
          // we can spread out the load, not that it's likely to actually
          // matter
          updateFeedMetadata(source, meta, group());
        })
        .on('complete', function (meta, articles) {
          createOrUpdateStories(source, articles, group());
        })
        .on('end', function() {
          log.trace("parsing complete");
          endEvent();
        });
    },
    function(err, results) {
    }
  );
}

function updateFeedMetadata(source, meta, done) {
}

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
        createNewPosts(source, articles, function(err, created) {

          log.info("Indexed " + created.length + "articles");

          if(!created || created.length <= 0) {
            done(null, []);
            return;
          }

          // for each article that we created, exctract links
          var processed_articles = 0;
          var created_uris = _.pluck(created, 'uri');
          _.each(articles, function(article) {
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
      var createVertexQueryFormat = "INSERT INTO Page (uri) VALUES ('%s')"
      db.command(createVertexQueryFormat, function(err, results) {
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

/** Exports **/
exports.parseFeed = parseFeed;
