build:
	yarn build
	rm -rf docs
	mkdir docs
	touch docs/CNAME
	echo "avatarposer.com" >> docs/CNAME
	mv dist/* docs/
