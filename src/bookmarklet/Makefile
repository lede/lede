all: build/bundle.js build/boot.html

build/bundle.js: 	widget/build/yarn.js widget/bookmarklet.js entry.js build
	./node_modules/browserify/bin/cmd.js entry.js -o build/bundle.js

widget/build/yarn.js: 	widget/bookmarklet.html widget/bookmarklet.css widget/build
	./node_modules/yarnify/bin/cmd.js widget -o widget/build/yarn.js

build/boot.html:	boot.html-template build/bookmarklet-link.js build
	./subst.py boot.html-template LINK --file build/bookmarklet-link.js > build/boot.html

build/bookmarklet-link.js:	bookmarklet-link-template.js build server-address.txt
	./subst.py bookmarklet-link-template.js SERVER_ADDRESS --file server-address.txt > build/bookmarklet-link.js

build:
	mkdir build

widget/build:
	mkdir -p widget/build

server-address.txt:
	if [ ! -f server-address.txt ]; then echo "unburythelede.com" > server-address.txt; fi

clean:
	rm -rf build/*
	rm -rf widget/build/*
