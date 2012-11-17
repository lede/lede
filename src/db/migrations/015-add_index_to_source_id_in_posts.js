var db = require('../db');

exports.up = function(next){
  db.run("CREATE INDEX posts_source_id_index ON posts (source_id)", next);
};

exports.down = function(next){
  db.run("DOP INDEX posts_source_id_index", next);
};
