var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.insert("reasons", ["id", "title", "description"], [7, "Too Large", "The requested feed exceeds the size limit"], callback);

};

exports.down = function(db, callback) {
  db.runSql("DELETE FROM reasons WHERE id = 7", callback);
};
