var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.createTable('ledes', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    post_id: 'int',
    user_id: 'int',
    name: 'text',
    created_at: 'timestamp',
    updated_at: 'timestamp'
  }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('ledes', callback);
};
