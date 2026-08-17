# Astro Bear Blog

A complete, static Astro blog template with a plain Bear Blog-inspired design. It supports Markdown and MDX content, blog posts under `/blog/`, root-level pages, tag archives, RSS, sitemap, social metadata, and a minimal CSS footprint.

Inspired by the [Hugo Bear Blog theme](https://github.com/janraasch/hugo-bearblog).

## Demo

See live demo at [astro-bearblog.harleyjwilson.workers.dev](https://astro-bearblog.harleyjwilson.workers.dev).

## Quick Start

Requirements: Node.js `>=22.12.0` and pnpm.

```sh
pnpm install
pnpm dev
```

## Configuration

Edit `src/consts.ts` before publishing:

- `SITE_TITLE`, `SITE_DESCRIPTION`, `SITE_LANG`
- `SITE_URL` — the canonical production URL used by RSS, sitemap, canonical links, and social cards
- `DATE_FORMAT`
- `SITE_FAVICON`
- `CUSTOM_STYLESHEET`
- `NAV_ITEMS` and `FOOTER_ITEMS`

The Open Graph image lives at `src/assets/opengraph.jpg`.

## Content

Site content is stored in Astro pages and content collections:

| Type        | Location                      | URL                |
| ----------- | ----------------------------- | ------------------ |
| Home page   | `src/pages/index.md`          | `/`                |
| Posts       | `src/content/blog/*.{md,mdx}` | `/blog/<slug>/`    |
| Pages       | `src/pages/**/*.{md,mdx}`     | based on file path |
| Blog index  | generated route               | `/blog/`           |
| Tag archive | generated route               | `/tags/<tag>/`     |

### Post frontmatter

```yaml
---
title: Example post
description: A short description for metadata and feeds.
pubDate: 2026-01-15
tags: [astro, blog]
updatedDate: 2026-01-16
draft: false
---
```

Required fields: `title`, `description`, `pubDate`.

Optional fields: `updatedDate`, `tags`, `draft`.

Draft posts and future-dated posts are excluded from generated pages and feeds.

### Page frontmatter

```yaml
---
layout: ../layouts/Base.astro
title: About
description: Optional page description.
---
```

Markdown pages should specify the shared `Base.astro` layout. The relative layout path depends on the page's directory.

## Commands

| Command        | Action                               |
| -------------- | ------------------------------------ |
| `pnpm dev`     | Start the local development server   |
| `pnpm build`   | Build the static site to `dist/`     |
| `pnpm check`   | Run Astro and TypeScript checks      |
| `pnpm preview` | Preview the production build locally |

## Acknowledgements

This project is inspired by [Bear Blog](https://bearblog.dev), created by [Herman](https://herman.bearblog.dev), and the [Hugo Bear Blog theme](https://github.com/janraasch/hugo-bearblog) by Jan Raasch.

## License

[MIT](LICENSE) © 2026 Harley Wilson
