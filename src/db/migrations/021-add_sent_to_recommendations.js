var db = require('../db');

exports.up = function(next){
  db.run("ALTER TABLE recommendations ADD COLUMN sent boolean DEFAULT false", next);
};

exports.down = function(next){
  db.run("ALTER TABLE recommendations DROP COLUMN sent", next);
};
