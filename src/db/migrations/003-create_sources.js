var db = require('../db');

exports.up = function(next){
  db.run("CREATE SEQUENCE sources_id_seq INCREMENT BY 1 START 1", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("CREATE TABLE sources(id INTEGER DEFAULT nextval('sources_id_seq'::regclass) CONSTRAINT id_not_null NOT NULL, title TEXT, description TEXT, url TEXT CONSTRAINT url_not_null NOT NULL, indexed_at TIMESTAMP, next_index_at TIMESTAMP, index_interval INTEGER DEFAULT 3600 CONSTRAINT index_interval_not_null NOT NULL, indexable BOOLEAN DEFAULT TRUE CONSTRAINT indexable_not_null NOT NULL, pshb_url TEXT, created_at TIMESTAMP CONSTRAINT created_at_not_null NOT NULL, updated_at TIMESTAMP CONSTRAINT updated_at_not_null NOT NULL, unique_content_at TIMESTAMP, last_published_at TIMESTAMP, not_indexable_reason_id INTEGER, failure_count INTEGER DEFAULT 0 CONSTRAINT failure_count_not_null NOT NULL)", next);
    }
  });
};

exports.down = function(next){
  db.run("DROP TABLE sources", function(err, result) {
    if(err) {
      console.log(err);
      next(err);
    } else { 
      db.run("DROP SEQUENCE sources_id_seq", next);
    }
  });
};
