var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.createTable('reasons', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    title: 'text',
    description: 'text',
    created_at: 'timestamp',
    updated_at: 'timestamp'
  }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('reasons', callback);
};
