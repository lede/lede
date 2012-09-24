var dbm = require('db-migrate');
var type = dbm.dataType;
var Step = require('step');

exports.up = function(db, callback) {
  Step(
    function () {
      var group = this.group();
      db.addColumn("sources", "not_indexable_reason_id", "int", group());
      db.changeColumn("reasons", "id", { primaryKey: true, autoIncrement: false, notNull: true }, group()); // drop autoincrement from PK because we'll be inserting records manually
      db.insert("reasons", ["id", "title", "description"], [1, "Resource Unavailable", "The requested URL is unavailable due to server down or HTTP 4xx errors"], group());
      db.insert("reasons", ["id", "title", "description"], [2, "Not a Feed", "The URL is accessible, but it is not a parseable feed"], group());
      db.insert("reasons", ["id", "title", "description"], [3, "No Unique Content", "The feed is a subset or duplicate of another feed in the database, so it does not offer any unique content"], group());
      db.insert("reasons", ["id", "title", "description"], [4, "Garbage", "Content is spam or fake or other crap we do not want to waste our time on"], group());
      db.insert("reasons", ["id", "title", "description"], [5, "Illegal", "We are required by law to block this content or it is believed to cause immense liability if we do not"], group());
      db.insert("reasons", ["id", "title", "description"], [6, "Alternate Content Source", "The content of this feed is acquired through some other method (such as direct API calls)"], group());
    },
    // use SQL until db-migrate supports adding constraints natively
    function constrain(err) {
      if (err) { callback(err); return; }
      db.runSql(
        'ALTER TABLE sources ADD FOREIGN KEY (not_indexable_reason_id) REFERENCES reasons;'
        , this);
    },
    callback
  );
};

exports.down = function(db, callback) {
  Step(
    function () {
      var group = this.group();
      db.removeColumn("sources", "not_indexable_reason_id", group());
      db.changeColumn("reasons", "id", { primaryKey: true, notNull: true, autoIncrement: true }, group());
      db.runSql("DELETE FROM reasons", group());
    },
    callback
  );
};
