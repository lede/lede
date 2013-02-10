all: build/bundle.js build/boot.html build/bookmarklet-generator.js

build/bundle.js: 	widget/build/yarn.js widget/bookmarklet.js entry.js build
	./node_modules/browserify/bin/cmd.js entry.js -o build/bundle.js

widget/build/yarn.js: 	widget/bookmarklet.html widget/bookmarklet.css widget/build
	./node_modules/yarnify/bin/cmd.js widget -o widget/build/yarn.js

build/boot.html:	boot.html
	cp boot.html build/boot.html

build/bookmarklet-generator.js: server-address.txt bookmarklet-generator.js
	./subst.py bookmarklet-generator.js SERVER_ADDRESS --file server-address.txt > build/bookmarklet-generator.js

build:
	mkdir build

widget/build:
	mkdir -p widget/build

server-address.txt:
	if [ ! -f server-address.txt ]; then echo "unburythelede.com" > server-address.txt; fi

clean:
	rm -rf build/*
	rm -rf widget/build/*
