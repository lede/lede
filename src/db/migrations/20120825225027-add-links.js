var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.createTable('links', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    from_post_id: 'int',
    to_post_id: 'int',
    created_at: 'timestamp',
    updated_at: 'timestamp'
    }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('links', callback);
};
