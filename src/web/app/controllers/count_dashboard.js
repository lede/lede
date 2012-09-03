// Base for a dashboard web service that allows the fetching of counts and counts over the last day

var orm = require("../../../core/datalayer").client;
var logger = require("../../../core/logger").getLogger("web");
var _ = require("underscore");
var string_format = require("util").format;

var total_sources_query_format = "select count(id) from %s";
var total_sources_yesterday_query_format = "select count(id) from %s where created_at < date_trunc('day', now())";

var total_sources_by_day_query_format = 
	"with counts AS ("
	+ "	select count(*), date_trunc('hour', created_at) as hour FROM %s group by date_trunc('hour', created_at) ORDER BY date_trunc('hour', created_at)"
	+ "), padding AS ("
	+ "	select 0 AS count, date_trunc('hour', s.a) as hour from generate_series(now() - interval '%d days', now(), interval '1 hour') as s(a)"
	+ ")"
	+ "SELECT padding.hour, padding.count + COALESCE(counts.count, 0) AS count FROM padding LEFT JOIN counts ON counts.hour = padding.hour";


exports.total = function(res, table_name) {
	var total_sources_query = string_format(total_sources_query_format, table_name);
	var total_sources_yesterday_query = string_format(total_sources_yesterday_query_format, table_name);

	orm.emit("query", total_sources_query, function(err, result) {
		if(err) {
			logger.error(err);
			res.status = 500;
			res.end();
			return;
		}

		orm.emit("query", total_sources_yesterday_query, function(yesterday_err, yesterday_result) {
			if(yesterday_err) {
				logger.error(yesterday_err);
				res.status = 500;
				res.end();
				return;
			}

			res.send ({ 
			  	item: [
			  		{ 
			  			text : "Total " + table_name,
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

exports.total_by_day = function(req, res, table_name) {
	try {
		var day = req.route.params.days;

		// THIS IS SO FUCKING UNSAFE SO BLOCK EVERY IP OTHER THAN GECKOBOARD
		var total_sources_by_day_query = string_format(total_sources_by_day_query_format, table_name, day);

		logger.info(total_sources_by_day_query);

		orm.emit("query", total_sources_by_day_query, function(err, result) {
			if(err) {
				logger.error(err);
				res.status = 500;
				res.end();
				return;
			}

			// Add highest and lowest values
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
		logger.error(e);
		res.end();
	}
};
