# Pathfinder Honors

Honors store for Pathfinder clubs. Static site (React, Vite, TypeScript, Tailwind) hosted on GitHub Pages at https://kiostz.github.io/pathfinder-honors-shop-my/.

## Run locally

Needs Node 24 (see `.nvmrc`).

    npm ci
    npm run dev

Open the address Vite prints. For the production build: `npm run build && npm run preview`, then open http://localhost:4173/pathfinder-honors-shop-my/.

## Order form settings

The order form reads two keys from the committed `.env` files, which are public by design:

- `VITE_WEB3FORMS_ACCESS_KEY` in `.env` (a placeholder until the order handler's Web3Forms key is pasted in; switching inbox later changes only this line).
- `VITE_HCAPTCHA_SITEKEY`: `.env` holds Web3Forms' shared sitekey for the production build; `.env.development` holds hCaptcha's always-passing test key, because hCaptcha refuses `localhost` with a real key.

`public/data/clubs.json` is a list of clubs: `name` plus `area`, `language`, `location` and `churchName` (each text or `null`). The seed's `--force` still writes `[]`, which is valid.

## Seed the data

`npm run seed` writes `public/data/honors.json`, `clubs.json` and `settings.json` from `scripts/seed/adventist-honors.csv`. It refuses to overwrite existing files. To overwrite them, run:

    npm run seed -- --force

## Patch pictures

`npm run patches` copies each honor's patch picture from the Pathfinder Wiki into `public/patches/`, sets `image` in `public/data/honors.json` and writes `scripts/patches/import-report.md`. It needs `cwebp` (`brew install webp`). If it ends with failed requests, run it again: it only fetches the honors that still have no picture.

## Test

    npm run lint
    npm run typecheck
    npm test

## Deploy

Deploy by pushing to `main`. The workflow `.github/workflows/deploy.yml` runs lint, typecheck and tests, then builds, in a build job; a separate deploy job publishes to Pages. If any step fails, nothing is published and the old site stays up. A deploy already running is never cancelled; a newer push waits for it. It can also be started by hand from the Actions tab.

One-time setup, done by the repository owner: in GitHub open Settings, then Pages, and set Source to GitHub Actions.
