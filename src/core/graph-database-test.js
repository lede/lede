settings = require('./settings').get("indexer");
var graphDatalayer = require('./graph-datalayer');

var query = "SELECT FROM OGraphVertex";

for(var i = 0; i < 100; i++) {
  graphDatalayer.query(query, function(error, results) {
    if(error){
      throw error;
    }

    console.log(results);
  });
}
