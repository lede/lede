var db = require('../db');

exports.up = function(next){
  db.run("ALTER TABLE ledes ADD COLUMN title text", next);
};

exports.down = function(next){
  db.run("ALTER TABLE ledes DROP COLUMN title", next);
};
