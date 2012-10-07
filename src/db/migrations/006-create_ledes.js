var db = require('../db');

exports.up = function(next){
  db.run("CREATE SEQUENCE ledes_id_seq INCREMENT BY 1 START 1", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("CREATE TABLE ledes(id INTEGER DEFAULT nextval('ledes_id_seq'::regclass) CONSTRAINT id_not_null NOT NULL, uri TEXT CONSTRAINT uri_not_null NOT NULL, user_id INTEGER CONSTRAINT user_id_not_null NOT NULL)", next);
    }
  });
};

exports.down = function(next){
  db.run("DROP TABLE ledes", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("DROP SEQUENCE ledes_id_seq", next);
    }
  });
};
