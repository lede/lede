var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.createTable('links', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    from_post_id: 'int',
    to_post_id: 'int',
    created_at: 'timestamp',
    updated_at: 'timestamp'
    }, constrain);

  // use SQL until db-migrate supports adding constraints natively
  function constrain(err) {
    if (err) { callback(err); return; }
    db.runSql(
      'ALTER TABLE links ADD FOREIGN KEY (from_post_id) REFERENCES posts;' +
      'ALTER TABLE links ADD FOREIGN KEY (to_post_id) REFERENCES posts;'
      , callback);
  }
};

exports.down = function(db, callback) {
  db.dropTable('links', callback);
};
