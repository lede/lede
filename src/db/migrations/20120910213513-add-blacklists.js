var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.createTable('blacklists', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    title: 'text',
    description: 'text',
    url: 'text',
    reason_id: 'int',
    created_at: 'timestamp',
    updated_at: 'timestamp'
  }, constrain);

  // use SQL until db-migrate supports adding constraints natively
  function constrain(err) {
    if (err) { callback(err); return; }
    db.runSql(
      'ALTER TABLE blacklists ADD FOREIGN KEY (reason_id) REFERENCES reasons;'
      , callback);
  }
};

exports.down = function(db, callback) {
  db.dropTable('blacklists', callback);
};
