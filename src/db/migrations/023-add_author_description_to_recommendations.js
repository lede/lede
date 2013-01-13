var db = require('../db');

exports.up = function(next){
  db.run("ALTER TABLE recommendations ADD COLUMN description text, ADD COLUMN author text", next);
};

exports.down = function(next){
  db.run("ALTER TABLE recommendations DROP COLUMN description, DROP COLUMN author", next);
};
