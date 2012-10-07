var db = require('../db');

exports.up = function(next){
  db.run("CREATE SEQUENCE links_id_seq INCREMENT BY 1 START 1", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("CREATE TABLE links(id INTEGER DEFAULT nextval('links_id_seq'::regclass) CONSTRAINT id_not_null NOT NULL, from_post_id INTEGER CONSTRAINT from_post_id_not_null NOT NULL, uri TEXT CONSTRAINT uri_not_null NOT NULL, created_at TIMESTAMP CONSTRAINT created_at_not_null NOT NULL, updated_at TIMESTAMP CONSTRAINT updated_at_not_null NOT NULL)", next);
    }
  });
};

exports.down = function(next){
  db.run("DROP TABLE links", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("DROP SEQUENCE links_id_seq", next);
    }
  });
};
