var db = require('../db');

exports.up = function(next){
  db.run("ALTER TABLE links ADD COLUMN link_text text NOT NULL", next);
};

exports.down = function(next){
  db.run("ALTER TABLE links DROP COLUMN link_text", next);
};
