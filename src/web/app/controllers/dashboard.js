var orm = require("../../../core/datalayer").client;
var _ = require("underscore");

var total_posts_query = "select count(*), date_trunc('hour', created_at) FROM posts group by date_trunc('hour', created_at) ORDER BY date_trunc('hour', created_at);";

exports.total_posts = function(req, res) {
	orm.emit("query", total_posts_query, function(err, result) {
		var items = _.map(result.rows, function(row) {
			return row.count;
		});
	

		res.send (
		  {
		  	item: items,
		  	settings: {
		  		axisy: [
		  			"Bad",
		  			"Good"
		  		]
		  	}
		  }
		);
	});
};

function totalPosts() {
	this.item 
}