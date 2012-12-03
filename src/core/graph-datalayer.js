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
  
  max: settings.graphConnectionParams.maxPoolSize,

  // Make sure to drain()
  min: settings.graphConnectionParams.minPoolSize, 

  // How long a resource can stay idle in pool before being removed
  idleTimeoutMillis : settings.graphConnectionParams.idleConnectionTimeout,
  
  // Logs via console.log - can also be a function
  log : true 
});

// Opens a database connection and calls the provided callback with the opened database connection and any errors that might have been encountered
exports.getClient = function openClient(callback) {
  pool.acquire(callback);
};

// If you use openClient, MAKE SURE TO RELEASE THAT SHIT!!
exports.releaseDb = function releaseDb(db) {
  pool.releaseDb(db);
};

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
