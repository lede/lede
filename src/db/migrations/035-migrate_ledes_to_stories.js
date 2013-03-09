var db = require('../db');
var _ = require('../node_modules/underscore');
var Step = require('../node_modules/step');

exports.up = function(next){
  db.run("SELECT DISTINCT uri FROM Ledes WHERE uri NOT IN (SELECT uri FROM Stories)", function(err, result) {
    if (err) {
      console.log(err);
      next();
    } else {
      Step(
        function() {
          var group = this.group();

          _.each(result.rows, function(row) {
            db.run("SELECT * FROM Ledes WHERE uri = $1 ORDER BY created_at ASC LIMIT 1", [row.uri], group());
          });
        },
        function(err, results) {
          if (err) {
            throw err;
          }

          var group = this.group();

          _.each(_.map(results, function(res) {
            return res.rows[0];
          }),
          function(story) {
            db.run("INSERT INTO Stories (uri, title, origin_type, created_by_user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)", [story.uri, story.title, 1, story.user_id, story.created_at, story.updated_at], group());
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
  db.run("DELETE FROM Stories WHERE origin_type = 1", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      //db.run("DROP SEQUENCE apikeys_id_seq", next);
      next();
    }
  });
};

