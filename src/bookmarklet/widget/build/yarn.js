module.exports = require("yarnify")("_f95f7ba6-",{"/bookmarklet.html":"<div id='pop-down' class='pop-down'>\n  <img id='lede-logo' class='lede-logo' src='http://192.168.0.103:3000/images/lede-logo.png'></img>\n</div>\n<script type='text/javascript'>\n  setTimeout(function() {\n    $(__LEDE_POPDOWN__).find('div').animate({\"top\": \"0px\"}, 1000);\n    setTimeout(function() {\n      $(__LEDE_POPDOWN__).find('div').animate({\"top\": \"-185px\"}, 2000);\n    }, 3000);\n  }, 200);\n</script>\n","/bookmarklet.css":["355945ca","._f95f7ba6-355945ca div._f95f7ba6._f95f7ba6-pop-down {\n  box-shadow: 0px 1px 3px rgba(0,0,0,0.5);\n  background: rgba(255,255,255,0.95);\n  position: fixed;\n  top: -185px;\n  left: 50% !important;\n  margin-left: -60px !important;\n  width: 120px !important;\n  z-index: 9000; /* arbitrary big number */\n}\n\n._f95f7ba6-355945ca img._f95f7ba6._f95f7ba6-lede-logo {\n  margin: 10px !important;\n  clear: none !important;\n}\n\n"]});
