settings = require('./settings').get("indexer");
var graphDatalayer = require('./graph-datalayer');

var query = "SELECT FROM OGraphVertex";

// graphDatalayer.query(query, function(error, results) {
//   if(error){d! Friends are awesome. As is paying attention!
//     console.log(err);
//   }

//   console.log("Found results:");
//   for (var i in results) {
//     console.log(results[i]);
//   }
// });

var addPagesQuery = "CREATE CLASS Page EXTENDS OGraphVertex";
var addHyperlinksQuery = "CREATE CLASS Hyperlink EXTENDS OGraphEdge";

graphDatalayer.query(addPagesQuery, function(error, results) {
  if(error){
    throw error;
  }

  graphDatalayer.query(addHyperlinksQuery, function(error, results) {
    if(error){
      throw error;
    }

    console.log(results);
  });
});
