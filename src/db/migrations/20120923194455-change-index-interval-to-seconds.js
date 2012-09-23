var dbm = require('db-migrate');
var type = dbm.dataType;
var Step = require('step');

exports.up = function(db, callback) {
  Step(
    function () {
      var group = this.group();
      db.runSql("UPDATE Sources SET index_interval = index_interval * 60", group());
      db.changeColumn("sources", "index_interval", { notNull: true, defaultValue: 3600 }, group());
    },
    callback
  );
};

exports.down = function(db, callback) {
  Step(
    function () {
      var group = this.group();
      db.runSql("UPDATE Sources SET index_interval = index_interval / 60", group());
      db.changeColumn("sources", "index_interval", { notNull: true,  defaultValue: 60 }, group());
    },
    callback
  );
};
