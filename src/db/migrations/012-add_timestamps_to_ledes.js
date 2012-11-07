var db = require('../db');

exports.up = function(next){
  db.run("ALTER TABLE ledes ADD COLUMN created_at TIMESTAMP", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("ALTER TABLE ledes ADD COLUMN updated_at TIMESTAMP", next);
    }
  });
  next();
};

exports.down = function(next){
  next();
};
