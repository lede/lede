var db = require('../db');

exports.up = function(next){
  db.run("INSERT INTO reasons (title, description, created_at, updated_at) VALUES ('Resource Unavailable', 'The requested URL is unavailable due to server down or HTTP 4xx errors', now(), now()); INSERT INTO reasons (title, description, created_at, updated_at) VALUES ('Not a Feed', 'The URL is accessible, but it is not a parseable feed', now(), now()); INSERT INTO reasons (title, description, created_at, updated_at) VALUES ('No Unique Content', 'The feed is a subset or duplicate of another feed in the database, so it does not offer any unique content', now(), now()); INSERT INTO reasons (title, description, created_at, updated_at) VALUES ('Garbage', 'Content is spam or fake or other crap we do not want to waster our time on', now(), now()); INSERT INTO reasons (title, description, created_at, updated_at) VALUES ('Illegal', 'We are required by law to block this content or it is believe to cause immense liability if we do not', now(), now()); INSERT INTO reasons (title, description, created_at, updated_at) VALUES ('Alternate Content Source', 'The content of this feed is acquired through some other means (such as direct API calls)', now(), now()); INSERT INTO reasons (title, description, created_at, updated_at) VALUES ('Too Large', 'The requested feed exceeds the size limit', now(), now());", next);
};

exports.down = function(next){
  db.run("DELETE FROM reasons", function(err, result) {
    if(err) {
      console.log(err);
      next();
    } else {
      db.run("SELECT setval('reasons_id_seq', 1)", next);
    }
  });
};
