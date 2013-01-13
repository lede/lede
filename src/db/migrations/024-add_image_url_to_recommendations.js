var db = require('../db');

exports.up = function(next){
  db.run("ALTER TABLE recommendations ADD COLUMN image_url text", next);
};

exports.down = function(next){
  db.run("ALTER TABLE recommendations DROP COLUMN image_url", next);
};
