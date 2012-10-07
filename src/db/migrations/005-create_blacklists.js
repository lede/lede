var db = require('../db');

exports.up = function(next){
  db.run("CREATE SEQUENCE blacklists_id_seq INCREMENT BY 1 START 1", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("CREATE TABLE blacklists(id INTEGER DEFAULT nextval('blacklists_id_seq'::regclass) CONSTRAINT id_not_null NOT NULL, title TEXT, description TEXT, url TEXT, reason_id INTEGER, created_at TIMESTAMP CONSTRAINT created_at_not_null NOT NULL, updated_at TIMESTAMP CONSTRAINT updated_at_timestamp_not_null NOT NULL)", next);
    }
  });
};

exports.down = function(next){
  db.run("DROP TABLE blacklists", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("DROP SEQUENCE blacklists_id_seq", next);
    }
  });
};
