module.exports = require("yarnify")("_5297c4ef-",{"/bookmarklet.css":["22040566","._5297c4ef-22040566 div._5297c4ef._5297c4ef-pop-down {\n  display: none;\n  box-shadow: 0px 1px 3px rgba(0,0,0,0.5);\n  background: rgba(255,255,255,0.95);\n  position: fixed;\n  top: 0px;\n  left: 0px;\n  width: 100%;\n  color: #444;\n  z-index: 9000; /* arbitrary big number */\n}\n\n  ._5297c4ef-22040566 div._5297c4ef._5297c4ef-pop-down h1._5297c4ef {\n    margin:10px;\n  }\n\n"],"/bookmarklet.html":"<div id='pop-down' class='pop-down'>\n  <h1>You now lede this story</h1>\n</div>\n<script type='text/javascript'>\n  setTimeout(function() {\n    $(__LEDE_POPDOWN__).find('div').slideDown();\n    setTimeout(function() {\n      $(__LEDE_POPDOWN__).find('div').slideUp();\n    }, 3000);\n  }, 200);\n</script>\n"});
