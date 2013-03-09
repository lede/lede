var pg = require('pg');
var config = require('./database.json')[process.env.LEDE_DB];

var conn_string = 'tcp://' + encodeURIComponent(config.user) + ':' + encodeURIComponent(config.password) + '@' + encodeURIComponent(config.host) + '/' + encodeURIComponent(config.database);
exports.run = function(query, vars, cb) {
  pg.connect(conn_string, function(err, client) {
    if(err) {
      console.err(err);
      cb(err);
    } else {
      if (!cb) { // compensate for only having 2 arguments, which should be query and cb
        cb = vars;
        vars = [];
      }

      client.query(query, vars, function(err, res) {
        if(err) {
          console.log(err);
        }
        cb(err, res);
      });
    }
  });
};
