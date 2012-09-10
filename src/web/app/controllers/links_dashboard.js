var orm = require("../../../core/datalayer").client;
var _ = require("underscore");
var string_formatter = require("util");
var dashboard = require("./count_dashboard.js");

var table_name = "links";

exports.total_links = function(req, res) {
	dashboard.total(req, res, table_name);
};

exports.total_links_by_day = function(req, res) {
	dashboard.total_by_day(req, res, table_name);
};
