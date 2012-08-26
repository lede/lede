var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.createTable('sources', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    title: 'text',
    description: 'text',
    url: 'text',
    indexed_at: 'timestamp',
    next_index_at: 'timestamp',
    index_interval: 'int',
    indexable: 'boolean',
    pshb_url: 'text',
    created_at: 'timestamp',
    updated_at: 'timestamp'
  }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('sources', callback);
};
