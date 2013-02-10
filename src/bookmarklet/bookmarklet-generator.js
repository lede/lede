function createBookmarkletLink(apikey) {

  var elem = document.createElement('A');
  elem.textContent = 'Lede This';
  elem.href = "javascript:(function(){var js_loader = function(source) {var script = document.createElement('SCRIPT');script.type = 'text/javascript';script.src = source;document.getElementsByTagName('head')[0].appendChild(script);}; js_loader('https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js');js_loader('http://{{{SERVER_ADDRESS}}}/bookmarklet/bundle.js');setTimeout(function() { var query = '?target=' + encodeURIComponent(window.location.href) + '&title=' + encodeURIComponent(document.title) + '&apikey=" + apikey + "&no_cache=' + Math.random(); js_loader('http://{{{SERVER_ADDRESS}}}/api/lede' + query); }, 500); })();";

  return elem;
}
