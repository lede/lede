var pg = require('pg');
var config = require('./database.json')[process.env.LEDE_DB];

var conn_string = 'tcp://' + config.user + ':' + config.password + '@' + config.host + '/' + config.database;
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
}
