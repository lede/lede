var db = require('../db');

exports.up = function(next){
  db.run("CREATE UNIQUE INDEX sources_url_unique ON sources (url)", next);
};

exports.down = function(next){
  db.run("ALTER TABLE sources DROP CONSTRAINT sources_url_unique", next);
};
