settings = require('./settings').get("indexer");
var graphDatalayer = require('./graph-datalayer');

graphDatalayer.getClient(function(err, db) {
  if(err){
    console.log(err);
  }

  console.log("Running select...");
  db.command("SELECT FROM OGraphVertex", function(error, results) {
    if(error){
      console.log(err);
    }

    console.log("Found results:");
    for (var i in results) {
      console.log(results[i]);
    }

    db.close();
  });
});
