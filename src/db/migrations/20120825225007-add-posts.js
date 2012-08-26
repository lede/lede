var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.createTable('posts', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    content: 'text',
    description: 'text',
    published_at: 'timestamp',
    indexed_at: 'timestamp',
    author: 'text',
    source: 'int',
    title: 'text',
    uri: 'text',
    links_extracted_at: 'timestamp',
    created_at: 'timestamp',
    updated_at: 'timestamp'
  }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('posts', callback);
};
