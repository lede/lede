var db = require('../db');

exports.up = function(next){
  db.run("ALTER TABLE recommendations ADD COLUMN sent_notification_id INTEGER DEFAULT null", next);
};

exports.down = function(next){
  db.run("ALTER TABLE recommendations DROP COLUMN sent_notification_id", next);
};
