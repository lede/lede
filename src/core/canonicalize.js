var http = require('http');
var https = require('https');
var url = require('url');
var util = require('util');

// getter objects for different protocols
var schemes = {
  "http:": http,
  "https:": https
};

function followLink(url, callback) {
  
}

exports.canonicalize = function(url, callback) {
  callback(null, url); // TODO this is a placeholder
};
