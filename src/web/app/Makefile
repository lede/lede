all:
	make -C ../../bookmarklet/
	mkdir -p public/bookmarklet/widget
	cp ../../bookmarklet/build/bundle.js public/bookmarklet/bundle.js
	cp ../../bookmarklet/build/bookmarklet-generator.js public/bookmarklet/bookmarklet-generator.js
	cp ../../bookmarklet/widget/bookmarklet.js public/bookmarklet/widget/bookmarklet.js
	cp ../../bookmarklet/build/boot.html public/bookmarklet/boot.html

clean:
	rm -rf public/bookmarklet
	make -C ../../bookmarklet clean
