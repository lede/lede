var db = require('../db');
var _ = require('../node_modules/underscore');
var Step = require('../node_modules/step');

exports.up = function(next){
  Step(
    function() {
      db.run("ALTER TABLE Ledes ADD COLUMN story_id integer NOT NULL DEFAULT 0", this);
    },
    function (err, result) {
      if (err) {
        throw err;
      }

      db.run("UPDATE Ledes SET story_id = s.id FROM Stories s WHERE Ledes.uri = s.uri", this);
    },
    function (err, result) {
      if (err) {
        throw err;
      }

      db.run("ALTER TABLE Ledes ALTER COLUMN story_id DROP DEFAULT", this);
    },
    next
  );
};

exports.down = function(next){
  db.run("ALTER TABLE Ledes DROP COLUMN story_id", next);
};

