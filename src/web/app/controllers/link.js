var orm = require("../../../core/datalayer").client;
var string_format = require("util").format;
var _ = require("underscore");
var no_err = require('../helpers/core').no_err;

var table_name = "links";

//var links_from_post_id_query_format =  "select distinct l.from_post_id, p.id as to_post_id, p.title, p.uri from links l join posts p on l.uri = p.uri where l.from_post_id = '%s'";
var links_from_post_id_query_format =  "select distinct l.from_post_id, p.id as to_post_id, p.title, p.uri from links l join posts p on l.uri = p.uri order by l.id DESC limit 1";
exports.links_from_post = function(req, res) {
  if(req.route.params.from_post_id) {
    //var links_from_post_id_query = string_format(links_from_post_id_query_format, req.route.params.from_post_id);
      var links_from_post_id_query = links_from_post_id_query_format;
    orm.emit("query", links_from_post_id_query, no_err(res, function(links) {
      if(!links) {
        res.status = 404;
        res.send({ result: 'Specified post does not exist' });
      } else {
        res.send(links.rows);
      }
    }));
  } else {
    res.status = 500;
    res.end({ result: 'Please specify a post from which to check links.' });
  }
};
