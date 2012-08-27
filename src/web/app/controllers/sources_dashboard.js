var orm = require("../../../core/datalayer").client;
var _ = require("underscore");
var string_formatter = require("util");


var total_sources_query = "select count(id) from sources";
var total_sources_yesterday_query = "select count(id) from sources where created_at < date_trunc('day', now())";

var total_sources_by_day_query_format = 
	"with counts AS ("
	+ "	select count(*), date_trunc('hour', created_at) as hour FROM sources group by date_trunc('hour', created_at) ORDER BY date_trunc('hour', created_at)"
	+ "), padding AS ("
	+ "	select 0 AS count, date_trunc('hour', s.a) as hour from generate_series(now() - interval '%d days', now(), interval '1 hour') as s(a)"
	+ ")"
	+ "SELECT padding.hour, padding.count + COALESCE(counts.count, 0) AS count FROM padding LEFT JOIN counts ON counts.hour = padding.hour";


exports.total_sources = function(req, res) {
	orm.emit("query", total_sources_query, function(err, result) {
		orm.emit("query", total_sources_yesterday_query, function(yesterday_err, yesterday_result) {
			if(err) {
				console.log(err);
			}

			if(yesterday_err) {
				console.log(yesterday_err);
			}

			res.send ({ 
			  	item: [
			  		{ 
			  			text : "Total sources",
        		  		value: result.rows[0].count
        			},
      			    { 
      			   	 	text: "From yesterday",
        		     	value: yesterday_result.rows[0].count
        		    }
				]
			});
		});
	});
};

exports.total_sources_by_day = function(req, res) {
	try {
		var day = req.route.params.days;

		// THIS IS SO FUCKING UNSAFE SO BLOCK EVERY IP OTHER THAN GECKOBOARD
		var total_sources_by_day_query = string_formatter.format(total_sources_by_day_query_format, day);

		console.log(total_sources_by_day_query);

		orm.emit("query", total_sources_by_day_query, function(err, result) {
			if(err) {
				console.log(err);
			}

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
	} catch (e) {
		console.log(e);
	}
};