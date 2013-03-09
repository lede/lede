var db = require('../db');
var _ = require('../node_modules/underscore');

exports.up = function(next){
  db.run("ALTER TABLE Recommendations DROP COLUMN uri, DROP COLUMN title, DROP COLUMN description, DROP COLUMN author, DROP COLUMN image_url", next);
};

exports.down = function(next){
  db.run("ALTER TABLE Recommendations ADD COLUMN uri text NOT NULL, ADD COLUMN title text NOT NULL, ADD COLUMN description text, ADD COLUMN author text, ADD COLUMN image_url text", next);
};

