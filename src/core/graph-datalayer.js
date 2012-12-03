var orient = require("orientdb"),
    Db = orient.Db,
    Server = orient.Server;
var pooler = require('generic-pool');

var server = new Server(settings.graphConnectionParams.serverConfig);

var pool = pooler.Pool({
  name: 'orient',
  
  create: function(callback) {
    var db = new Db(settings.graphConnectionParams.database, server, settings.graphConnectionParams.dbConfig);
    db.open(function(err) {
      callback(err, db);
    });
  },
  
  destroy: function(client) { db.close(); },
  
  max: 10,

  // Make sure to drain()
  min: 2, 

  // How long a resource can stay idle in pool before being removed
  idleTimeoutMillis : 30000,
  
  // Logs via console.log - can also be a function
  log : true 
});

// Opens a database connection and calls the provided callback with the opened database connection and any errors that might have been encountered
function openClient(callback) {
  pool.acquire(callback);
};

exports.getClient = openClient;

exports.query = function(query, callback) {
  pool.acquire(function(err, db) {
    if(err) {
      pool.release(db);
      callback(err);
      return;
    }

    db.command(query, function(err, results) {
      if(err) {
        pool.release(db);
        callback(err);
        return;
      }

      pool.release(db);
      callback(err, results);
    });
  });
};
