var db = require('../db');
var _ = require('../node_modules/underscore');
var Step = require('../node_modules/step');

exports.up = function(next){
  Step(
    function() {
      var group = this.group();

      db.run("ALTER TABLE Apikeys ADD PRIMARY KEY (id)", group());
      db.run("CREATE INDEX ON Apikeys (apikey)", group());

      db.run("ALTER TABLE Blacklists ADD PRIMARY KEY (id)", group());

      db.run("ALTER TABLE Ledes ADD PRIMARY KEY (id)", group());

      db.run("ALTER TABLE Notifications ADD PRIMARY KEY (id)", group());
      db.run("CREATE INDEX ON Notifications (user_id)", group());
      db.run("CREATE INDEX ON Notifications (created_at)", group());

      db.run("ALTER TABLE Recommendations ADD PRIMARY KEY (id)", group());
      db.run("CREATE INDEX ON Recommendations (user_id)", group());
      db.run("CREATE INDEX ON Recommendations (sent)", group());
      db.run("CREATE INDEX ON Recommendations (created_at)", group());

      db.run("ALTER TABLE Users ADD PRIMARY KEY (id)", group());
      db.run("CREATE INDEX ON Users (email, password_hash)", group());
      db.run("CREATE INDEX ON Users (admin)", group());
      db.run("DROP INDEX users_id_index", group());
    },
    function (err, result) {
      if (err) {
        console.log(err);
      }

      next(err, result);
    }
  );
};

exports.down = function(next){
  Step(
    function() {
      var group = this.group();

      db.run("ALTER TABLE Apikeys DROP CONSTRAINT apikeys_pkey", group());
      db.run("DROP INDEX apikeys_apikey_idx", group());

      db.run("ALTER TABLE Blacklists DROP CONSTRAINT blacklists_pkey", group());

      db.run("ALTER TABLE Ledes DROP CONSTRAINT ledes_pkey", group());

      db.run("ALTER TABLE Notifications DROP CONSTRAINT notifications_pkey", group());
      db.run("DROP INDEX notifications_user_id_idx", group());
      db.run("DROP INDEX notifications_created_at_idx", group());

      db.run("ALTER TABLE Recomendations DROP CONSTRAINT recommendations_pkey", group());
      db.run("DROP INDEX recommendations_user_id_idx", group());
      db.run("DROP INDEX recommendations_sent_idx", group());
      db.run("DROP INDEX recommendations_created_at_idx", group());

      db.run("ALTER TABLE Users DROP CONSTRAINT users_pkey", group());
      db.run("DROP INDEX users_email_password_hash_idx)", group());
      db.run("DROP INDEX users_admin_idx", group());
      db.run("CREATE INDEX users_id_index ON Users (id)", group());
    },
    function (err, result) {
      if (err) {
        console.log(err);
      }

      next(err, result);
    }
  );
};

