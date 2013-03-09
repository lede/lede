var db = require('../db');

exports.up = function(next){
  db.run("ALTER TABLE stories ADD UNIQUE (uri)", next);
};

exports.down = function(next){
  db.run("ALTER TABLE stories DROP CONSTRAINT stories_uri_unique", next);
};
