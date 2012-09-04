var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
	db.runSql("ALTER TABLE links DROP CONSTRAINT links_to_post_id_fkey;", callback);
	db.runSql("ALTER TABLE links ALTER COLUMN to_post_id TYPE text;", callback);
	db.runSql("ALTER TABLE links RENAME COLUMN to_post_id TO uri;", callback);
};

exports.down = function(db, callback) {
	db.runSql("ALTER TABLE links RENAME COLUMN uri TO to_post_id;", callback);
	db.runSql("ALTER TABLE links ALTER COLUMN to_post_id TYPE int;", callback);
	db.runSql("ALTER TABLE links ADD CONSTRAINT links_to_post_id_fkey FOREIGN KEY (to_post_id) REFERENCES posts;", callback);
};
