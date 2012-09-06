all: build/bundle.js

build/bundle.js: widget/build/yarn.js widget/bookmarklet.js entry.js
									./node_modules/browserify/bin/cmd.js entry.js -o build/bundle.js

widget/build/yarn.js: widget/bookmarklet.html widget/bookmarklet.css
												./node_modules/yarnify/bin/cmd.js widget -o widget/build/yarn.js
