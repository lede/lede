var pg = require('pg');
var config = require('./database.json')[process.env.LEDE_DB];

var conn_string = 'tcp://' + encodeURIComponent(config.user) + ':' + encodeURIComponent(config.password) + '@' + encodeURIComponent(config.host) + '/' + encodeURIComponent(config.database);
exports.run = function(query, cb) {
  pg.connect(conn_string, function(err, client) {
    if(err) {
      console.err(err);
      cb(err);
    } else {
      client.query(query, function(err, res) {
        if(err) { 
          console.log(err);
        } 
        cb();
      });
    }
  });
};
