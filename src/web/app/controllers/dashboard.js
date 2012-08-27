var orm = require("../../../core/datalayer").client;
var _ = require("underscore");

var total_posts_query = 
	"with counts AS ("
	+ "	select count(*), date_trunc('hour', created_at) as hour FROM posts group by date_trunc('hour', created_at) ORDER BY date_trunc('hour', created_at)"
	+ "), padding AS ("
	+ "	select 0 AS count, date_trunc('hour', s.a) as hour from generate_series(now() - interval '7 days', now(), interval '1 hour') as s(a)"
	+ ")"
	+ "SELECT padding.hour, padding.count + COALESCE(counts.count, 0) AS count FROM padding LEFT JOIN counts ON counts.hour = padding.hour";

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