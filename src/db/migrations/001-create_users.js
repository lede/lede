var db = require('../db');

exports.up = function(next){
  db.run("CREATE SEQUENCE users_id_seq INCREMENT BY 1 START 1", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("CREATE TABLE users(id INTEGER DEFAULT nextval('users_id_seq'::regclass) CONSTRAINT id_not_null NOT NULL, email TEXT CONSTRAINT email_not_null NOT NULL, password_hash TEXT CONSTRAINT password_hash_not_null NOT NULL, created_at TIMESTAMP CONSTRAINT created_at_not_null NOT NULL, updated_at TIMESTAMP CONSTRAINT updated_at NOT NULL)", next);
    }
  });
};

exports.down = function(next){
  db.run("DROP TABLE users", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("DROP SEQUENCE users_id_seq", next);
    }
  });
};
