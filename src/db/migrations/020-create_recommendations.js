var db = require('../db');

exports.up = function(next){
  db.run("CREATE SEQUENCE recommendations_id_seq INCREMENT BY 1 START 1", function(err, result) {
    if(err) {
      console.log(err);
      next(err);
    } else {
      db.run("CREATE TABLE recommendations(id INTEGER DEFAULT nextval('recommendations_id_seq'::regclass) CONSTRAINT id_not_null NOT NULL, uri TEXT CONSTRAINT uri_not_null NOT NULL, title TEXT CONSTRAINT title_not_null NOT NULL, user_id INTEGER CONSTRAINT user_id_not_null NOT NULL, created_by_user_id INTEGER CONSTRAINT created_by_user_id_not_null NOT NULL, created_at TIMESTAMP CONSTRAINT created_at_not_null NOT NULL, updated_at TIMESTAMP CONSTRAINT updated_at NOT NULL)", next);
    }
  });
};

exports.down = function(next){
  db.run("DROP TABLE recommendations", function(err, result) {
    if(err) {
      console.log(err);
      next(err);
    } else {
      db.run("DROP SEQUENCE recommendations_id_seq", next);
    }
  });
};
