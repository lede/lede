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
    source_id: 'int',
    title: 'text',
    uri: 'text',
    links_extracted_at: 'timestamp',
    created_at: 'timestamp',
    updated_at: 'timestamp'
  }, constrain);

  // use SQL until db-migrate supports adding constraints natively
  function constrain(err) {
    if (err) { callback(err); return; }
    db.runSql(
      'ALTER TABLE posts ADD FOREIGN KEY (source_id) REFERENCES sources;'
      , callback);
  }
};

exports.down = function(db, callback) {
  db.dropTable('posts', callback);
};
