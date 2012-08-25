(function(){
  var loader = function(source) {
    var script = document.createElement('SCRIPT');
    script.type = 'text/javascript';
    script.src = source;
    document.getElementsByTagName('head')[0].appendChild(script)
  }
  loader('https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js');
  loader('http://unburythelede.com/bookmarklet/lede.js');
})();
