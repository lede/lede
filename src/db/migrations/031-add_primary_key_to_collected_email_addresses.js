var db = require('../db');

exports.up = function(next){
  db.run("ALTER TABLE collected_email_addresses ADD PRIMARY KEY (email)", next);
};

exports.down = function(next){
  next();
};
