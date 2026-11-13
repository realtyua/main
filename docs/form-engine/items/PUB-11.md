# PUB-11: Close test debt — pure runtime on `../runtime/*`, site-coupled to adapters

## Context
Follow-up to PUB-6 (packaging). PUB-6 introduced `package.json` exports, `runtime/` as the public entry point, and `validate-config.mjs` schema fix. The existing 18 tests in `test/` imported from `../assets/js/form-engine/*` (which no longer exists in the published package) and 4 tests read site artifacts (`_data/*.yml`, `_includes/form/app/*.html`, `_site/`, `_form-engine/tools/*`).

## Scope
Done in the SAME worktree/branch as PUB-6 (`feat/PUB-6-package-exports`) because it depends on PUB-6's uncommitted `validate-config.mjs` schema path fix.

### Classification
| Group | Tests | Destination |
|-------|-------|-------------|
| Pure runtime (import `../assets/js/form-engine/*`) | `add-property-parity`, `binder`, `conditions`, `controller`, `form-page`, `html`, `layout`, `model`, `render`, `render-tailwind`, `theme-render-parity`, `validation` | Stay in `test/`, imports → `../runtime/*` |
| Jekyll-coupled (read `_data`, `_includes`, `_site`, `_form-engine`) | `add-property-wire`, `config`, `theme-wire-parity`, `form-app-fresh` (renamed `bake-contract`) | `adapters/jekyll/test/` + local fixtures |
| Eleventy-coupled (read `_data/notify.yml`) | `notify-config`, `notify-parity` | `adapters/eleventy/test/` + local fixture |

## Changes

### Root `test/` (12 pure runtime + packaging)
- Rewrote imports: `../assets/js/form-engine/` → `../runtime/`
- Verified: **171/171 pass** + 5 packaging = **176/176** green

### `adapters/jekyll/test/` (4 tests + fixtures)
- Moved: `add-property-wire.test.mjs`, `config.test.mjs`, `theme-wire-parity.test.mjs`
- Renamed: `form-app-fresh.test.mjs` → `bake-contract.test.mjs` (rewritten as self-contained temp-site bake contract test)
- Fixtures copied from `realtyua/main`:
  - `add-property.yml`, `add-property.html` (baked)
  - `_config.yml` (minimal: `baseurl`, `usd/eur/nbu`, `add_property_endpoint`, `turnstile`, etc.)
  - `_data/uk.yml` (minimal copy strings used by `site-opts.mjs`)
  - `_includes/css/leaflet.css`, `_includes/js/leaflet.js`
  - `assets/data/all.json` (585 KB, full real file — required by 5 disk-backed tests), `districts.json`, `districts-30559.json`
- Imports rewritten to `../../../runtime/*`, `../../../tools/yaml.mjs`, `../../../adapters/jekyll/tools/site-opts.mjs`
- Verified: **37/37 pass**

### `adapters/eleventy/test/` (2 tests + fixture)
- Moved: `notify-config.test.mjs`, `notify-parity.test.mjs`
- Fixture: `notify.yml` (identical in Jekyll and 11ty)
- Imports rewritten to `../../../runtime/*`, `../../../tools/yaml.mjs`
- Verified: **20/20 pass**

### `package.json`
- Added scripts:
  - `test:jekyll` → `node --test "adapters/jekyll/test/**/*.test.mjs"`
  - `test:eleventy` → `node --test "adapters/eleventy/test/**/*.test.mjs"`

## Gates
All green in the PUB-6 worktree:
- `npm test` (root): **176/176 pass**
- `npm run test:jekyll`: **37/37 pass**
- `npm run test:eleventy`: **20/20 pass**

## Notes
- `form-app-fresh` (which compared baked output against a fresh render using the real site) was rewritten as `bake-contract.test.mjs`. It creates a temp site, copies the engine + minimal fixtures, runs `loadSiteOpts` + `renderPage`, and verifies structural equivalence (not byte-for-byte, since site data differs). This avoids duplicating the engine in git.
- The 585 KB `all.json` is committed to `adapters/jekyll/test/fixtures/assets/data/` because 5 tests in `add-property-wire` exercise the real address index (mode/threshold/search behavior depends on exact settlement counts). A synthetic fixture would require re-verifying all mode transitions.
- `notify.yml` is identical in Jekyll and 11ty; one copy under `adapters/eleventy/test/fixtures/`.
- No commits made; all changes remain in the PUB-6 worktree for review together.

## Handoff to PUB-7/PUB-10
Root `npm test` is green (required before PUB-7/PUB-10). The test debt is closed. The adapter test suites are isolated and runnable independently.