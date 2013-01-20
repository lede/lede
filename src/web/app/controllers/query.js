var log = require('../../../core/logger').getLogger("web");
var util = require('util');

//TODO: put in some more sane validation here
exports.translate = function(query) {
 
  var select = {};
  var attributes = {};
 
  //build the attributes map
  if(query.order) {
    attributes.order = [query.order]; 
    delete query.order;
  }
  if(query.limit) {
    attributes.limit = query.limit; 
    delete query.limit;
  }
  if(query.offset) {
    attributes.offset = query.offset; 
    delete query.offset;
  }
  if(query.only) {
    attributes.only = query.only.split(',');
    delete query.only;
  }

  //after removing the attributes, send the select as is
  select = query;

  return {select: select, attributes: attributes};
};
