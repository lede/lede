var domready = require('domready');
var widget = require('./widget/bookmarklet');

domready(function() {
  widget.inject(document.body);
});
