var db = require('../db');

exports.up = function(next){
  db.run("ALTER TABLE users ADD COLUMN admin boolean DEFAULT false", next);
};

exports.down = function(next){
  db.run("ALTER TABLE users DROP COLUMN admin", next);
};
