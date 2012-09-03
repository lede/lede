var dbm = require('db-migrate');
var type = dbm.dataType;
var Step = require('step');

exports.up = function(db, callback) {
  Step(
    function() {
      var group = this.group();

      db.removeIndex("sources_url_index", group());
      db.removeIndex("posts_uri_index", group());
    },
    callback
  );
};

exports.down = function(db, callback) {
  Step(
    function() {
      var group = this.group();

      db.addIndex("sources", "sources_url_index", ["url"], group());
      db.addIndex("posts", "posts_uri_index", ["uri"], group());
    },
    callback
  );
};
