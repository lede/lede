var db = require('../db');

exports.up = function(next){
  db.run("CREATE SEQUENCE posts_id_seq INCREMENT BY 1 START 1", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else { 
      db.run("CREATE TABLE posts(id INTEGER DEFAULT nextval('posts_id_seq'::regclass) CONSTRAINT id_not_null NOT NULL, content TEXT, description TEXT, published_at TIMESTAMP, indexed_at TIMESTAMP, author TEXT, source_id INTEGER, title TEXT, uri TEXT CONSTRAINT uri_not_null NOT NULL, links_extracted_at TIMESTAMP, created_at TIMESTAMP CONSTRAINT created_at_not_null NOT NULL, updated_at TIMESTAMP CONSTRAINT updated_at_not_null NOT NULL)", next);
    }
  });
};

exports.down = function(next){
  db.run("DROP TABLE posts", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("DROP SEQUENCE posts_id_seq", next);
    }
  });
};
