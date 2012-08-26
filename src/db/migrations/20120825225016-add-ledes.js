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
  }, constrain);

  // use SQL until db-migrate supports adding constraints natively
  function constrain(err) {
    if (err) { callback(err); return; }
    db.runSql(
      'ALTER TABLE ledes ADD FOREIGN KEY (post_id) REFERENCES posts;' +
      'ALTER TABLE ledes ADD FOREIGN KEY (user_id) REFERENCES users;'
      , callback);
  }
};

exports.down = function(db, callback) {
  db.dropTable('ledes', callback);
};
