var db = require('../db');

exports.up = function(next){
  db.run("CREATE TABLE collected_email_addresses (email TEXT CONSTRAINT collected_email_not_null NOT NULL, created_at TIMESTAMP CONSTRAINT collected_email_created_at_not_null NOT NULL, can_create_account_as_of TIMESTAMP)", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("CREATE UNIQUE INDEX collected_email_unique ON collected_email_addresses (email)", next)
    }
  });
};

exports.down = function(next){
  db.run("ALTER TABLE collected_email_addresses DROP CONSTRAINT collected_email_unique", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("DROP TABLE collected_email_addressess", next)
    }
  });
};
