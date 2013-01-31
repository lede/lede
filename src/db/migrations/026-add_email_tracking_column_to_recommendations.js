var db = require('../db');

exports.up = function(next){
  db.run("ALTER TABLE recommendations ADD COLUMN clicked_at timestamp", next);
};

exports.down = function(next){
  db.run("ALTER TABLE recommendations DROP COLUMN clicked_at", next);
};
