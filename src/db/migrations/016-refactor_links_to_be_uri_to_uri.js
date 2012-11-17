var db = require('../db');

exports.up = function(next){
  db.run("ALTER TABLE links DROP COLUMN from_post_id", function(err, result) {
    db.run("ALTER TABLE links ADD COLUMN from_uri text", next);
  });
};

exports.down = function(next){
  db.run("ALTER TABLE links ADD COLUMN from_post_id int", function(err, result) {
    db.run("ALTER TABLE links DROP COLUMN from_uri", next);
  });
};
