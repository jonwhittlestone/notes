# Notes

A personal blog inspired by Zettelkasten, built with Jekyll.

https://jonwhittlestone.github.io/notes/

## Development

### Prerequisites

- Ruby 3.x
- Bundler (`gem install bundler`)

### Setup

```bash
make install
```

### Preview locally

```bash
make serve
```

Visit http://localhost:4000/notes/ (includes live reload).

### Other commands

```bash
make build   # Build the site to _site/
make clean   # Remove generated files
```

If `bundle` is in your PATH, run commands with: `BUNDLE=bundle make serve`

### Creating a post

Create a new file in `_posts/` with the format `YYYY-MM-DD-title.md`:

```markdown
---
toc: false
layout: post
title: Your Post Title
categories: ["Category"]
description: A short description
image: /images/posts/your-image.jpg
hide: false
---

Your content here...
```

Images go in `/images/posts/`.

### Scheduled publishing

Draft posts can be queued for automatic publishing at 2pm UK time daily:

1. Create a feature branch (e.g. `draft/my-post`)
2. Write your post and open a PR to `master`
3. Add the `ready-to-publish` label when ready
4. The post will be auto-merged and published at 2pm

See [docs/scheduled-publish-workflow.md](docs/scheduled-publish-workflow.md) for full details and testing instructions.

## Deployment

Push to `master` and GitHub Actions will deploy to the `gh-pages` branch automatically.
