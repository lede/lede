settings = require('./settings').get("indexer");
var graphDatalayer = require('../core/graph-datalayer');

var query = "SELECT FROM OGraphVertex";

graphDatalayer.query(query, function(error, results) {
  if(error){
    console.log(err);
  }

  console.log("Found results:");
  for (var i in results) {
    console.log(results[i]);
  }
});
