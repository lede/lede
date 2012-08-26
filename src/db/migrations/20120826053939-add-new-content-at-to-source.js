var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.addColumn("sources", "new_content_at", 'timestamp', callback);
};

exports.down = function(db, callback) {
  db.removeColumn("sources", "new_content_at", callback);
};
