var db = require('../db');

exports.up = function(next){
  db.run("CREATE UNIQUE INDEX post_uri_index ON posts (uri)", next);
};

exports.down = function(next){
  db.run("DROP INDEX post_uri_index", next);
};
