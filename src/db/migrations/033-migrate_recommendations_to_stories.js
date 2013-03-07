var db = require('../db');
var _ = require('../underscore');
var Step = require('../underscore');

exports.up = function(next){
  db.run("SELECT DISTINCT uri FROM recommendations", function(err, result) {
    if (err) {
      console.log(err);
      next();
    } else {
      Step(
        function() {
          var group = this.group();

          _.each(result.rows, function(row) {
            db.run("SELECT * FROM Recommendations WHERE uri = $1 ORDER BY created_at ASC LIMIT 1", [row.uri], group());
          });
        },
        function(err, results) {
          if (err) {
            throw err;
          }

          var group = this.group();

          _.each(results, function(story) {
            db.run("INSERT INTO Stories (uri, title, description, author, image_url, origin_type, created_by_user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9", [story.uri, story.title, story.description, story.author, story.image_url, 0, story.created_by_user_id, story.created_at, story.updated_at], group());
          });
        }, 
        function(err, results) {
          if (err) {
            console.log(err);
          }
          next(err, results);
        }
      );
    }
  });
};

exports.down = function(next){
  db.run("DELETE FROM Stories", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      //db.run("DROP SEQUENCE apikeys_id_seq", next);
      next();
    }
  });
};

