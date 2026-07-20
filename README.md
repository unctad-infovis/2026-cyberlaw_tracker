# 2026-cyberlaw_tracker

**Live demo** https://unctad-infovis.github.io/2026-cyberlaw_tracker/

## About

The Global Cyberlaw Tracker monitors the state of legal frameworks governing e-commerce and the digital economy across the world's economies, covering areas such as consumer protection, cybercrime, electronic transactions, indirect taxation, and privacy and data protection.

The page renders an interactive world map and accompanying data table that let users explore each economy's legislative status — legislation in place, draft legislation, no legislation, or no data — across these legal areas, filterable by region and development grouping, with country-level detail shown on hover. Content is authored in MDX and rendered as a standalone React application embeddable within UNCTAD's Drupal platform.

## Embedding

```html
<script type="module" crossorigin="" src="https://storage.unctad.org/2026-cyberlaw_tracker/js/2026-cyberlaw_tracker.min.js?v=1"></script>
<link rel="stylesheet" crossorigin="" href="https://storage.unctad.org/2026-cyberlaw_tracker/css/2026-cyberlaw_tracker.min.css?v=1">
<div class="app-root-2026-cyberlaw_tracker" id="app-root-2026-cyberlaw_tracker">
  Loading...
</div>
<noscript>Your browser does not support Javascript!</noscript>
```

Update the `?v=` query parameter to match the current build version to bust the cache.

## Used in

* [Summary of Adoption of E-Commerce Legislation Worldwide](https://unctad.org/topic/ecommerce-and-digital-economy/ecommerce-law-reform/summary-adoption-e-commerce-legislation-worldwide)

## Rights of usage

Contact Teemo Tebest.

## How to build and develop

This is a Vite + React project.

* `npm install`
* `npm run start`

Project should start at: http://localhost:8080

For developing please refer to `package.json`

## How to update data

1. Replace the data files at `./public/assets/data/data.csv` and `./public/assets/data/document_links.json`
2. Check in browser that everything works with `npm run start`
3. Update the meta data at `./src/meta.json`
4. Create a new production build `npm run build` 
5. Syncronize project to Azure Storage `npm run sync-prod` 
6. Push changes to remote Git.

## Files and folders

All public assets go to folder `public`.

All source code goes to folder `src`.

## Packages

The following packages are used in this project by default.

### Project specific

* **highcharts** — is used to create the map
* **react-is-visible** — is used to check if the visualisation is in viewport
* **react-select** — is used to create the select menu
* **uuid** — is used to create unique keys

### Build & Dev Server

* **vite** — development server with hot module replacement and production bundler, replaces webpack
* **@vitejs/plugin-react** — adds React and JSX support to Vite

### React

* **react** — UI component library
* **react-dom** — renders React components to the DOM

### Formatter & Linter

* **@biomejs/biome** — formats and lints JS, JSX and CSS files on save, replaces ESLint + Prettier

### Minification

* **terser** — minifies the production JavaScript bundle, removes console.logs in production builds

### MDX

* **@mdx-js/rollup** — Vite/Rollup plugin that compiles MDX files into React components
* **@mdx-js/react** — provides React context for MDX components