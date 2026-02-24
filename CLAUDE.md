# CLAUDE.md

## Project
aiva-docs — Multi-project documentation site built with Docusaurus 3.9.2 (TypeScript)

## Stack
- Docusaurus 3.9.2, React 19, MDX, TypeScript 5.6
- Styling: Infima CSS framework + CSS modules
- Node >= 20 required

## Commands
- `npm start` — dev server
- `npm run build` — production build
- `npm run serve` — serve built output
- `npm run typecheck` — TypeScript checking
- `npm run clear` — clear Docusaurus cache

## Key Files
- `docusaurus.config.ts` — site config (branding, navbar, footer, plugins)
- `sidebars.ts` — sidebar structure (auto-generated from directory)
- `src/css/custom.css` — theme colors (Infima CSS variables)
- `docs/` — documentation content (organized by project folders)
- `blog/` — blog/changelog posts

## Conventions
- Config files are TypeScript (.ts not .js)
- Docs use frontmatter: sidebar_position, title, slug, tags
- Category metadata via `_category_.json` in each folder
- Multi-project docs use multi-instance `plugin-content-docs` with separate id/path/sidebar per project
- Content is MDX-compatible (can use React components in markdown)

## Architecture
- Uses `@docusaurus/preset-classic` (bundles docs + blog + pages plugins)
- For multiple projects: add extra `plugin-content-docs` instances in config
- Each project gets its own folder, sidebar file, and route base path
- v4 future compatibility flag is enabled
