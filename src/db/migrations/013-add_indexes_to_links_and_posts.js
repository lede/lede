var db = require('../db');

exports.up = function(next){
  db.run("CREATE INDEX lower_links_uri_index ON links (lower(uri))", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("CREATE INDEX from_post_id_index ON links (from_post_id)", function(err, result) {
        if(err) {
          console.log(err);
          next();
        } else {
          db.run("CREATE UNIQUE INDEX post_id_index ON posts (id)", function(err, result) {
            if(err) {
              console.log(err);
              next();
            } else {
              db.run("CREATE INDEX lower_ledes_uri_index ON ledes (lower(uri))", function(err, result) {
                if(err) {
                  console.log(err);
                  next();
                } else {
                  db.run("CREATE INDEX ledes_user_id_index ON ledes (user_id)", function(err, result) {
                    if(err) {
                      console.log(err);
                      next();
                    } else {
                      db.run("CREATE UNIQUE INDEX users_id_index ON users (id)", next)
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
};

exports.down = function(next){
  db.run("DROP INDEX lower_links_uri_index", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("DROP INDEX from_post_id_index", function(err, result) {
        if(err) {
          console.log(err);
          next();
        } else {
          db.run("DROP UNIQUE INDEX post_id_index", function(err, result) {
            if(err) {
              console.log(err);
              next();
            } else {
              db.run("DROP INDEX lower_ledes_uri_index", function(err, result) {
                if(err) {
                  console.log(err);
                  next();
                } else {
                  db.run("DROP INDEX ledes_user_id_index", function(err, result) {
                    if(err) {
                      console.log(err);
                      next();
                    } else {
                      db.run("DROP UNIQUE INDEX users_id_index", next);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
};
