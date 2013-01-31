
exports.up = function(next){
  db.run("ALTER TABLE notifications ADD COLUMN delivered_at timestamp", function(err, result){
    db.run("ALTER TABLE notifications ADD COLUMN opened_at timestamp", function(err, result){
      db.run("ALTER TABLE recommendations ADD COLUMN clicked_at timestamp", next);
    });
  });
};

exports.down = function(next){
  db.run("ALTER TABLE notifications DROP COLUMN delivered_at", function(err, result){
    db.run("ALTER TABLE notifications DROP COLUMN opened_at", function(err, result){
      db.run("ALTER TABLE recommendations DROP COLUMN clicked_at", next);
    });
  });
};
