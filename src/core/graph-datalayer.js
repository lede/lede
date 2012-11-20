var orient = require("orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var server = new Server(settings.graphConnectionParams.serverConfig);
var db = new Db(settings.graphConnectionParams.database, server, settings.graphConnectionParams.dbConfig);

// Opens a database connection and calls the provided callback with the opened database connection and any errors that might have been encountered
function openClient(callback) {
  db.open(function(err) {
    callback(err, db);
  });
};

exports.getClient = openClient;

exports.query = function(query, callback) {
  openClient(function(err, db) {
    if(err){
      callback(err);
      db.close();
      return;
    }

    db.command(query, function(err, results) {
      if(err){
        callback(err);
        db.close();
        return;
      }

      db.close();

      callback(err, results);
    });
  });
};
