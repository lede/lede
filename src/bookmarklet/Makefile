SERVER_ADDRESS=localhost

all: build/bundle.js boot.html

build/bundle.js: 	widget/build/yarn.js widget/bookmarklet.js entry.js
									./node_modules/browserify/bin/cmd.js entry.js -o build/bundle.js

widget/build/yarn.js: 	widget/bookmarklet.html widget/bookmarklet.css
												./node_modules/yarnify/bin/cmd.js widget -o widget/build/yarn.js

boot.html:	boot.html-template
						sed "s/{{{SERVER_ADDRESS}}}/$(SERVER_ADDRESS)/g" boot.html-template > build/boot.html

clean:
			rm -rf build/*
			rm -rf widget/build/*

install: 	build/bundle.js boot.html
					mkdir -p ../web/app/public/bookmarklet/
					mkdir -p ../web/app/public/bookmarklet/widget
					cp build/bundle.js ../web/app/public/bookmarklet/bundle.js
					cp widget/bookmarklet.js ../web/app/public/bookmarklet/widget/bookmarklet.js
					cp build/boot.html ../web/app/public/bookmarklet/boot.html

uninstall: 	../web/app/public/bookmarklet/bundle.js
						rm -rf ../web/app/public/bookmarklet/
