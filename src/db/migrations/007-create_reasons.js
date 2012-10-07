var db = require('../db');

exports.up = function(next){
  db.run("CREATE SEQUENCE reasons_id_seq INCREMENT BY 1 START 1", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("CREATE TABLE reasons(id INTEGER DEFAULT nextval('reasons_id_seq'::regclass) CONSTRAINT id_not_null NOT NULL, title TEXT, description TEXT, created_at TIMESTAMP CONSTRAINT created_at_not_null NOT NULL, updated_at TIMESTAMP CONSTRAINT updated_at_not_null NOT NULL)", next);
    }
  });
};

exports.down = function(next){
  db.run("DROP TABLE reasons", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("DROP SEQUENCE reasons_id_seq", next);
    }
  });
};
