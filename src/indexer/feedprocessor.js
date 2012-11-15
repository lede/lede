var FeedParser = require('feedparser');
var dataLayer = require('../core/datalayer');
var linkTracker = require('./linktracker');
var _ = require('underscore');
var util = require('util');

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

      if(articles.length > 0) {
        // Insert any new posts
        createNewPosts(source, articles, function(err, result) {

          // TODO: update source metadata
          
          // TODO: linktracker stuff

          // TODO: linktracker stuff, see: linkTracker.processPostContent(postCreated.rows[0]);

        });
      }

    });
  } catch (e) {
    done(e);
  }
}

function createNewPosts(source, articles, callback) {

  if(articles.length <= 0) {
    throw new Error("Postive number of articles required!");
  }

  /* Generate appropriate number of $1, $2, ... etc placeholders for articles */

  // Map of fields we care about in article to fields in post
  //
  // Specifically, this maps fields in article (the object returned by the feed parser)
  // to descriptions of fields in the posts table in the database.
  //
  // Each field description is an object with two methods:
  //  name - the name of the column in the posts
  //  type - the postgres sql type name for the column
  //
  // TODO: add contents, author, published_at, etc
  // TODO: add additional descriptor regarding quoting of fields (if necessary w/ prepared statements)
  //
  var fields = {
    link: { name: 'uri', type: 'text' },
    title: { name: 'title', type: 'text' }
  }


  // Get number of fields so we don't have to hardcode/update as we change fields definition
  // TODO: there is likely a nicer way to do this..
  var field_count = 0;
  _.each(fields, function() {
    field_count++;
  });


  // little helper to generate global field offsets from a field index, article index, and field count
  var field_offset = function(field_index, article_index) {
    return article_index + field_index + (article_index * field_count) + 1;
  }

  // This gets a bit yucky.. build a prepared statement with properly numbered placeholders
  // For context, the data structure here is an array of literal post records, materialized it looks like:
  // 
  // array[('foo.com'::text, 'Foo Title'::text, 10::int, now(), now()), ...]
  // 
  // Where the first postition is the uri, the second is the title, next is source id, then updated/created times
  //
  // Although, as far as we're going to get pre-prepared statement parser is:
  //
  // array[($1::text, $2::text, $3::int, now(), now()), ...]
  //
  // NOTE:  This is a bit hairy and you probably don't need to modify it.
  //        Only one assumption is made, and that's that the last 3 fields are the source_id and timestamps.
  //        Any changes as to what we're including, how we're pulling it out of the article object,
  //        and in what order we're including it can be acheived via editing the fields = { } declaration above.

  var article_placeholders = "array[" + _.map(articles, function(article, article_index) {

    // build the internal record tuple, i.e: ($1::text, $2::text ...)
    var field_index = 0;
    return record = "(" + 
      // actual array of fields + types from article.. ['$1::text', '$2::text']
      _.map(fields, function(post_field_descriptor, article_field) {
        var virtual_column = "$" + field_offset(field_index, article_index) + "::" + post_field_descriptor.type;
        field_index++;
        return virtual_column
      }).concat(['$' + field_offset(field_index, article_index) + '::int', 'now()', 'now()']).join(', ') +  // we add the source_id and two timestamps always for now..
    ")";

  }).join(', ') + "]"; // join up the individual records to get the psql array: array[(...), (...), ...]


  // Ok, now build the array of arguments to the prepared statement
  // This is structurally the same as the above statement builder
  // It just unrolls all of the necessary arguments into an array and joins them up after
  // appending one final source id for a scoping where clause
  var prepared_arguments = _.flatten(
    _.map(articles, function(article, article_index) {

      return _.map(fields, function(post_field_descriptor, article_field) {
        return article[article_field];
      }).concat([source.id]);

    }).concat([source.id])

  );

  // build the tuple to describe the schema of our anonymous post-type to allow us to use our literals
  //
  // This is of the form:
  // (name type, name type, ...)
  //
  // Again, this is completely driven by the fields = {...} declaration above
  // assuming that the last three fields are source id and the timestamps

  var record_fields = _.map(fields, function(post_field_descriptor, article_field) {
    return post_field_descriptor.name + " " + post_field_descriptor.type;
  }).concat(['source_id int', 'created_at timestamptz', 'updated_at timestamptz']).join(', ');


  // build the tuple to describe fields we're inserting
  //
  // This is of the form:
  // (name , name, ...)
  //
  // Again, this is completely driven by the fields = {...} declaration above
  // assuming that the last three fields are source id and the timestamps

  // TODO: use _.pluck
  var insert_fields = _.map(fields, function(post_field_descriptor, article_field) {
    return post_field_descriptor.name;
  }).concat(['source_id', 'created_at', 'updated_at']).join(', ');


  // Ok, we're done setting up the placeholders, so...
  // build up the final templatized query to run
  var query = "" + 
    "WITH articles AS ( " +
      "WITH articles AS ( " +
        "SELECT (explode_array).* FROM explode_array( " +
          article_placeholders + " " +
        ") AS (" + record_fields + ") " +
      ") " + 
      "SELECT * FROM articles " + 
      "WHERE articles.uri NOT IN ( " +
        "SELECT uri FROM posts WHERE source_id =  $" + (prepared_arguments.length) + // the last argument is an extra source id 
      ") " +
    ") " + 
    "INSERT INTO posts (" + insert_fields + ") SELECT * FROM articles; ";

  // run it!
  log.debug("Running batch insert: " + query);
  dbClient.query(query, prepared_arguments, function(err, result) {
    if(err) {
      log.fatal("Error running query: " + query);
      log.fatal("Prepared args were: " + util.inspect(prepared_arguments));
      throw(err); // for now fail hard
    }

    log.debug("Success!");

    // It worked!
    // At this point we've inserted any new posts that we found from the feed.
    // Call the callback with our result set to do any post processing
    callback(null, result);
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
