var db = require('../db');

exports.up = function(next){
  db.run("CREATE UNIQUE INDEX idx_post_uri ON posts (uri)", next);
};

exports.down = function(next){
  db.run("DROP INDEX idx_posts_uri", next);
};
