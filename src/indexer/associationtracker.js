var _ = require('underscore');
var util = require('util');
var dataLayer = require('../core/datalayer');
var graphDatalayer = require('../core/graph-datalayer');
var htmlparser = require('htmlparser');
var url = require('url');
var select = require('soupselect').select;

// TODO consider the difference between an article 
// and a story and implement different methods for determining 
// these properties. The current thinking is to implement each of 
// these to be source agnostic (article|story)


// Interesting idea from here: https://code.google.com/p/boilerpipe/
// Basically, humans use two buckets when writing: short,long
// One can extract the text content of a page by grabbing only
// long blocks of contiguous text
//
// Naive jQuery implementation:
/*
$('p').each( function(i,t) {
  if($(t).text().length > 500) { 
    console.log($(t).text())
  } 
});
*/

// Grab author. Consider trying to come to some canonicalized
// version of the name (maybe just lc() to start)
function extractAuthor (story, callback) {

}

// No metadata exists to map to this in an RSS article
// still, I think it's a notion worth exploring
function extractGenre(story, callback) {

}

// Grab the source publication
function extractSource(story, callback) {

}

// Extract categor{y,ies} 
function extractCategories(story, callback) {

}

// Extract the tone of the article (negative/positive/neutral)
// No metadata exists to map this directly to an RSS article
// TODO: see if I can get some info on how crimson hexagon did this
function extractTone(story, callback) {

}

// Compare stories to determine relationship
// This must be exported as a way to compare stories, perhaps
// accepting weights for the above properties
function compareStories(stories, weights, callback) {

}

// Currently overkill wrapper
exports.compareStories = function(stories, weights, callback) {
  return compareStories(stories, weights, callback);
};
