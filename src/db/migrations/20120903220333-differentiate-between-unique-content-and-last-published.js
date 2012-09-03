var dbm = require('db-migrate');
var type = dbm.dataType;
var Step = require('step');

exports.up = function(db, callback) {
  Step(
    function() {
      var group = this.group();

      // this column stores the timestamp (our server time) at which a never-before-seen post was found in this feed
      db.renameColumn("sources", "new_content_at", "unique_content_at", group());
      // this column stores the timestamp (in their server's time) at which the most recent article was published
      db.addColumn("sources", "last_published_at", "timestamp", group());
    },
    callback
  );
};

exports.down = function(db, callback) {
  Step(
    function() {
      var group = this.group();

      db.renameColumn("sources", "unique_content_at", "new_content_at", group());
      db.removeColumn("sources", "last_published_at", group());
    },
    callback
  );
};

