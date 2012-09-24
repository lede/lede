var dbm = require('db-migrate');
var type = dbm.dataType;
var Step = require('step');

exports.up = function(db, callback) {
  Step(
    function () {
      var group = this.group();
      db.addColumn("sources", "failure_count", { type: "int", notNull: true, defaultValue: 0 }, group());
    },
    callback
  );  
};

exports.down = function(db, callback) {
  Step(
    function () {
      var group = this.group();
      db.removeColumn("sources", "failure_count", group());
    },
    callback
  );  
};
