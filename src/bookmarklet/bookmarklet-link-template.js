(function(){var js_loader = function(source) {var script = document.createElement('SCRIPT');script.type = 'text/javascript';script.src = source;document.getElementsByTagName('head')[0].appendChild(script);}; js_loader('https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js');js_loader('http://{{{SERVER_ADDRESS}}}/bookmarklet/bundle.js');setTimeout(function() { var img = new Image(); var query = '?target=' + encodeURIComponent(window.location.href) + '&title=' + encodeURIComponent(document.title) + '&no_cache=' + Math.random(); img.src = 'http://{{{SERVER_ADDRESS}}}/api/lede' + query; document.body.appendChild(img)}, 500)})();
