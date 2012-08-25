
(function() {
  var popdown = document.createElement('div');
  popdown.id = 'popdown';
  $(popdown).html("<style>div#popdown{display:none;border-bottom:1px solid #999;background:#f5f5f5;position:absolute;top:0px;left:0px;width:100%;color:#333;}#popdown h1{margin:10px;}</style><h1>You now lede this story</h1>");
  document.getElementsByTagName('body')[0].appendChild(popdown);
  $('div#popdown').slideDown();
  console.log('Hello Lede');
})();
