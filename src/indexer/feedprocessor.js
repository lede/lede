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


/** Exports **/
exports.parseFeed = parseFeed;
