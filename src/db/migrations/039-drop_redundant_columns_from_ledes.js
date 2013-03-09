var db = require('../db');
var _ = require('../node_modules/underscore');

exports.up = function(next){
  db.run("ALTER TABLE Ledes DROP COLUMN uri, DROP COLUMN title", next);
};

exports.down = function(next){
  db.run("ALTER TABLE Ledes ADD COLUMN uri text NOT NULL, ADD COLUMN title text", next);
};

