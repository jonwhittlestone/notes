.PHONY: help install serve build clean

# Bundle path - modify if your Ruby gems are installed elsewhere
BUNDLE ?= $(HOME)/snap/code/208/.local/share/gem/ruby/3.3.0/bin/bundle

help:
	@echo "Available commands:"
	@echo "  make install  - Install Ruby dependencies"
	@echo "  make serve    - Start local Jekyll server at http://localhost:4000/notes/"
	@echo "  make build    - Build the site to _site/"
	@echo "  make clean    - Remove generated files"
	@echo ""
	@echo "If bundle is in PATH, run: BUNDLE=bundle make serve"

install:
	$(BUNDLE) config set --local path 'vendor/bundle'
	$(BUNDLE) install

serve:
	$(BUNDLE) exec jekyll serve --livereload

build:
	JEKYLL_ENV=production $(BUNDLE) exec jekyll build

clean:
	$(BUNDLE) exec jekyll clean
	rm -rf _site .jekyll-cache .jekyll-metadata
