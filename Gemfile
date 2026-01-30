source "https://rubygems.org"

# Jekyll
gem "jekyll", "~> 4.3.0"

# Theme
gem "minima", "~> 2.5"

# Plugins
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-gist"
  gem "jekyll-octicons"
  gem "jekyll-remote-theme"
  gem "jekyll-twitter-plugin"
  gem "jekyll-relative-links"
  gem "jekyll-seo-tag"
  gem "jekyll-toc"
  gem "jekyll-paginate"
  gem "jekyll-sitemap"
end

# Markdown and emoji
gem "kramdown-parser-gfm"
gem "jemoji"

# Windows and JRuby support
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Lock http_parser to older version for JRuby
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]

# Webrick for local development (required for Ruby 3+)
gem "webrick", "~> 1.8"
