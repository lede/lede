SERVER_ADDRESS=unburythelede.com

all: build/bundle.js build/boot.html

build/bundle.js: 	widget/build/yarn.js widget/bookmarklet.js entry.js
	./node_modules/browserify/bin/cmd.js entry.js -o build/bundle.js

widget/build/yarn.js: 	widget/bookmarklet.html widget/bookmarklet.css
	./node_modules/yarnify/bin/cmd.js widget -o widget/build/yarn.js

build/boot.html:	boot.html-template build/bookmarklet-link.js
	./subst.py boot.html-template LINK --file build/bookmarklet-link.js > build/boot.html

build/bookmarklet-link.js:	bookmarklet-link-template.js
	./subst.py bookmarklet-link-template.js SERVER_ADDRESS --value $(SERVER_ADDRESS) > build/bookmarklet-link.js

clean:
	rm -rf build/*
	rm -rf widget/build/*

install: 	build/bundle.js build/boot.html
	mkdir -p ../web/app/public/bookmarklet/widget
	cp build/bundle.js ../web/app/public/bookmarklet/bundle.js
	cp widget/bookmarklet.js ../web/app/public/bookmarklet/widget/bookmarklet.js
	cp build/boot.html ../web/app/public/bookmarklet/boot.html

uninstall: 	../web/app/public/bookmarklet/bundle.js
	rm -rf ../web/app/public/bookmarklet/
