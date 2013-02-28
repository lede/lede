var db = require('../db');

exports.up = function(next){
  db.run("CREATE TABLE stories (id serial PRIMARY KEY, uri text NOT NULL, title text NOT NULL, description text, author text, image_url text, origin_type integer NOT NULL, created_by_user_id integer, created_at timestamp without time zone NOT NULL, updated_at timestamp without time zone NOT NULL)", function(err, result) {
    if(err) {
      console.log(err);
    }
    next();
  });
};

exports.down = function(next){
  db.run("DROP TABLE stories", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      //db.run("DROP SEQUENCE apikeys_id_seq", next);
      next();
    }
  });
};

