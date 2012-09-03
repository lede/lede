var dbm = require('db-migrate');
var type = dbm.dataType;
var Step = require('step');

exports.up = function(db, callback) {
  Step(
    function () {
      // add not-null and unique constraints
      db.changeColumn("sources", "url", { notNull: true, unique: true }, this.parallel());
      db.changeColumn("sources", "indexable", { notNull: true, defaultValue: true }, this.parallel());
      db.changeColumn("sources", "index_interval", { notNull: true, defaultValue: 60 }, this.parallel());
      db.changeColumn("sources", "created_at", { notNull: true }, this.parallel());
      db.changeColumn("sources", "updated_at", { notNull: true }, this.parallel());

      db.changeColumn("posts", "uri", { notNull: true, unique: true }, this.parallel());
      db.changeColumn("posts", "created_at", { notNull: true }, this.parallel());
      db.changeColumn("posts", "updated_at", { notNull: true }, this.parallel());

      db.changeColumn("links", "from_post_id", { notNull: true }, this.parallel());
      db.changeColumn("links", "to_post_id", { notNull: true }, this.parallel());
      db.changeColumn("links", "created_at", { notNull: true }, this.parallel());
      db.changeColumn("links", "updated_at", { notNull: true }, this.parallel());

      db.changeColumn("ledes", "post_id", { notNull: true }, this.parallel());
      db.changeColumn("ledes", "user_id", { notNull: true }, this.parallel());
      db.changeColumn("ledes", "created_at", { notNull: true }, this.parallel());
      db.changeColumn("ledes", "updated_at", { notNull: true }, this.parallel());

      db.changeColumn("users", "email", { notNull: true, unique: true }, this.parallel());
      db.changeColumn("users", "created_at", { notNull: true }, this.parallel());
      db.changeColumn("users", "updated_at", { notNull: true }, this.parallel());
    },
    function (err, result) {
      // add indexes
      db.addIndex("sources", "sources_url_index", ["url"], this.parallel());
      db.addIndex("sources", "sources_next_index_at_index", ["next_index_at"], this.parallel());
      db.addIndex("sources", "sources_created_at_index", ["created_at"], this.parallel());

      db.addIndex("posts", "posts_uri_index", ["uri"], this.parallel());
      db.addIndex("posts", "posts_created_at_index", ["created_at"], this.parallel());

      db.addIndex("links", "links_from_post_id_index", ["from_post_id"], this.parallel());
      db.addIndex("links", "links_to_post_id_index", ["to_post_id"], this.parallel());
      db.addIndex("links", "links_created_at_index", ["created_at"], this.parallel());
    },
    callback
  );
};

exports.down = function(db, callback) {
  Step(
    function () {
      // remove not-null and unique constraints
      db.changeColumn("sources", "url", { notNull: false, unique: false }, this.parallel());
      db.changeColumn("sources", "indexable", { notNull: false, defaultValue: undefined }, this.parallel());
      db.changeColumn("sources", "index_interval", { notNull: false, defaultValue: undefined }, this.parallel());
      db.changeColumn("sources", "created_at", { notNull: false }, this.parallel());
      db.changeColumn("sources", "updated_at", { notNull: false }, this.parallel());

      db.changeColumn("posts", "uri", { notNull: false, unique: false }, this.parallel());
      db.changeColumn("posts", "created_at", { notNull: false }, this.parallel());
      db.changeColumn("posts", "updated_at", { notNull: false }, this.parallel());

      db.changeColumn("links", "from_post_id", { notNull: false }, this.parallel());
      db.changeColumn("links", "to_post_id", { notNull: false }, this.parallel());
      db.changeColumn("links", "created_at", { notNull: false }, this.parallel());
      db.changeColumn("links", "updated_at", { notNull: false }, this.parallel());

      db.changeColumn("ledes", "post_id", { notNull: false }, this.parallel());
      db.changeColumn("ledes", "user_id", { notNull: false }, this.parallel());
      db.changeColumn("ledes", "created_at", { notNull: false }, this.parallel());
      db.changeColumn("ledes", "updated_at", { notNull: false }, this.parallel());

      db.changeColumn("users", "email", { notNull: false, unique: false }, this.parallel());
      db.changeColumn("users", "created_at", { notNull: false }, this.parallel());
      db.changeColumn("users", "updated_at", { notNull: false }, this.parallel());
    },
    function (err, result) {
      // remove indexes
      db.removeIndex("sources_url_index", this.parallel());
      db.removeIndex("sources_next_index_at_index", this.parallel());
      db.removeIndex("sources_created_at_index", this.parallel());

      db.removeIndex("posts_uri_index", this.parallel());
      db.removeIndex("posts_created_at_index", this.parallel());

      db.removeIndex("links_from_post_id_index", this.parallel());
      db.removeIndex("links_to_post_id_index", this.parallel());
      db.removeIndex("links_created_at_index", this.parallel());
    },
    callback
  );
}
