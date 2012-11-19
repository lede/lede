var db = require('../db');

exports.up = function(next){
  db.run("CREATE INDEX idx_links_from_uri ON links (lower(uri))", next);
};

exports.down = function(next){
  db.run("DROP INDEX idx_link_from_uri", next);
};
