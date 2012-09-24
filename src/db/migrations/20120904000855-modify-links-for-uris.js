var dbm = require('db-migrate');
var type = dbm.dataType;
var Step = require('step');

exports.up = function(db, callback) {
  Step(
  	function() {
	  db.runSql("ALTER TABLE links DROP CONSTRAINT links_to_post_id_fkey;", this.parallel());
	  db.changeColumn("links", "to_post_id", { type: 'text' }, this.parallel());
  	},
  	function() {
      db.renameColumn("links", "to_post_id", "uri", this.parallel());
  	},
    callback
  );
};

exports.down = function(db, callback) {
  Step(
  	function() {
  	  db.renameColumn("links", "uri", "to_post_id", this.parallel());
	  db.changeColumn("links", "to_post_id", { type: 'int' }, this.parallel());
  	},
  	function() {
	  db.runSql("ALTER TABLE links ADD CONSTRAINT links_to_post_id_fkey FOREIGN KEY (to_post_id) REFERENCES posts;", this.parallel());
  	},
    callback
  );
};
