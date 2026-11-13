# PUB-6 — `package.json`, exports, versioning, changelog

Phase: 6 · Depends: PUB-2..5 · Repo: form-engine
Branch: `feat/PUB-6-package-exports` · Worktree: `../worktrees/PUB-6-package-exports`

Status: `review`

## Goal

`form-engine` — валідний, імпортований пакет версії `1.0.0`: метадані й `exports`
відповідають фактичному layout-у (`runtime/`, `schema/`, `adapters/`), кожен
експорт резолвиться, версія узгоджена з `CHANGELOG.md`, а скрипти `package.json`
не посилаються на неіснуючі файли.

## Files

### Target (form-engine/)
- `package.json` — метадані, `version: 1.0.0`, `exports`, `files`, scripts
- `CHANGELOG.md` — **новий**, Keep a Changelog + запис `1.0.0`
- `test/packaging.test.mjs` — **новий**, контракт пакета (exports, версія, files)
- `tools/validate-config.mjs` — лише шлях до схеми: `../schema/...` замість
  `_form-engine/schema/...` (схема вже живе в корені пакета)

### Не змінюється
- `runtime/**`, `adapters/**`, `schema/**`, `LICENSE`, `NOTICE`, `README.md`
- усі інші `test/*.test.mjs` — див. «Out of scope»

## Steps

1. Створити worktree `PUB-6-package-exports` від `master` репозиторію `form-engine`.
2. Усередині worktree: `git checkout -b feat/PUB-6-package-exports`.
3. Junction на канонічний `node_modules`:
   `cmd /c mklink /J node_modules ..\..\main\node_modules` (без `npm install`).
4. Baseline gates **до** змін; зафіксувати фактичний стан (очікувано: `npm test`
   червоний через застарілі шляхи після PUB-2..5 — це відомий борг, не регресія
   PUB-6).
5. `package.json`:
   - `version` → `1.0.0`; `private: true` **лишається** (рішення про npm-публікацію
     — PUB-10, відкрите питання №4 плану);
   - `exports`: `.` → `./runtime/app.js`; `./runtime/*` → `./runtime/*`;
     `./schema/form-config.schema.json`; `./adapters/jekyll/*` і
     `./adapters/eleventy/*` — як сирі файли для copy-in інтеграції;
     `./package.json`;
   - `files`: `runtime/`, `adapters/`, `tools/`, `schema/`, `CHANGELOG.md`,
     `LICENSE`, `NOTICE`, `README.md`;
   - `main`/`module` → `./runtime/app.js`; `sideEffects` не виставляти в `false`
     (`runtime/app.js` самобутиться на `document`);
   - scripts: прибрати неіснуючі `check` (`tools/check.mjs`) і `verify-render`
     (`tools/verify-render.ps1`); лишити робочі `test`, `validate`, додати
     `check:add-property`, `check:notify` лише якщо їхні шляхи валідні.
6. `CHANGELOG.md`: `## [1.0.0]` з оглядом Phase 1–6 (runtime, теми, Jekyll,
   11ty, tools/schema, паритет) і `## [Unreleased]` для наступних змін.
7. `test/packaging.test.mjs`: перевіряє `name`, `version` = верхній запис
   CHANGELOG, наявність кожного target-а з `exports`, `files`, відсутність
   `private`-конфлікту з заявленим статусом, і що `import('form-engine')` та
   `import('form-engine/runtime/render.js')` резолвляться.
8. `tools/validate-config.mjs`: `SCHEMA_PATH` → `resolve(dirname(...), '..',
   'schema', 'form-config.schema.json')`; usage-коментарі без `_form-engine/`.
9. Гейти item (див. нижче).
10. Handoff у цей файл + рядок у `WORKITEMS.md` (Branch/Worktree/Status).

## Acceptance

- `package.json` валідний JSON, `version: 1.0.0`, без посилань на неіснуючі файли.
- Кожен target у `exports` існує у worktree.
- `import('form-engine')` і `import('form-engine/runtime/render.js')` працюють.
- `CHANGELOG.md` має `1.0.0` першим релізним записом, дата = дата item.
- `test/packaging.test.mjs` зелений.
- `validate-config.mjs` знаходить `schema/form-config.schema.json` у пакеті.
- Runtime, адаптери, схема й наявні тести не змінюються (крім шляху схеми).
- Жоден інший item не зачеплений.

## Gates

- **P** (packaging): `node --test test/packaging.test.mjs`
- **E** (exports): `node --input-type=module -e "await import('form-engine'); await import('form-engine/runtime/render.js')"`
- **T** (наявний suite): `npm test` — **зафіксувати як known-red**, причина:
  тести/тули PUB-5 скопійовані з Jekyll-розкладкою (`../assets/js/form-engine/`,
  `_form-engine/tools/`, `_data/`). Виправлення — окремий item, не PUB-6.

```powershell
node --test test/packaging.test.mjs
node --input-type=module -e "await import('form-engine'); await import('form-engine/runtime/render.js')"
npm test
```

## Out of scope

- Виправлення застарілих import-шляхів у `test/**`, `tools/check-*.mjs`,
  `adapters/**` і приведення всього suite до зеленого — **новий item**
  (пропозиція ID: `PUB-11 — test fixtures + import paths`).
- Перенесення site-coupled тестів у `adapters/jekyll/test` / фікстури — PUB-11.
- Examples — PUB-7. README/getting started — PUB-8. Config reference/theming —
  PUB-9. CI + реліз/публікація `1.0.0`, зняття `private` — PUB-10.
- Будь-які зміни в `runtime/`, темах, рендері чи конфігах.

## Handoff log

- **2026-11-13**: status `review` — packaging scope done in `form-engine` worktree
  `X:/OpenCodeData/opencode/worktree/247de9/PUB-6-package-exports`, branch
  `feat/PUB-6-package-exports` (junction to canonical `node_modules` created,
  removed before worktree cleanup). Files changed: `package.json` (version
  `0.0.0` → `1.0.0`, added `exports`/`files`/`main`/`module`, removed broken
  `check` and `verify-render` scripts, added `test:packaging`), new
  `CHANGELOG.md` (Keep a Changelog, `[Unreleased]` + `[1.0.0] - 2026-11-13`),
  new `test/packaging.test.mjs` (5 checks), `tools/validate-config.mjs` schema
  path `_form-engine/schema/...` → package-relative `../schema/...`.
  Gates: **P** `node --test test/packaging.test.mjs` 5/5 pass; **E**
  `import('form-engine')` + `import('form-engine/runtime/render.js')` resolve;
  `validate-config --strict` on the three realtyua configs 3/3 valid.
  **T** `npm test`: baseline and after both `fail 18` — the inherited suite
  still imports the old Jekyll layout (`assets/js/form-engine/...`,
  `_form-engine/tools/...`, `_data/...`), so `ERR_MODULE_NOT_FOUND`; this is a
  pre-existing extraction gap, not a PUB-6 regression (packaging test adds
  `pass 5`).
  Leftovers / out of scope: repairing those import paths and providing
  fixtures — proposed new item `PUB-11`; `private: true` stays until PUB-10
  resolves open question #4 (npm publish vs GitHub Release).
  Commit SHA: — (not committed; awaiting review).

- **2026-11-13 (follow-up)**: PUB-11 executed in the SAME worktree (depends on
  PUB-6's uncommitted `validate-config.mjs` schema fix).
  - Pure runtime tests (12): imports `../assets/js/form-engine/` → `../runtime/*` → **171/171 pass**.
  - Jekyll-coupled tests (4) moved to `adapters/jekyll/test/` with local fixtures
    (`add-property.yml`, `add-property.html`, `_config.yml`, `_data/uk.yml`,
    `_includes/css/leaflet.css`, `_includes/js/leaflet.js`,
    `assets/data/all.json` (585 KB), `districts.json`, `districts-30559.json`) → **37/37 pass**.
  - Eleventy-coupled tests (2) moved to `adapters/eleventy/test/` with
    `notify.yml` fixture → **20/20 pass**.
  - `form-app-fresh.test.mjs` rewritten as `bake-contract.test.mjs` (self-contained
    temp-site bake contract test, no engine duplication).
  - Added scripts `test:jekyll` / `test:eleventy` to `package.json`.
  - Root `npm test` now **176/176 pass** (green — required before PUB-7/PUB-10).
  All changes remain uncommitted in the PUB-6 worktree for combined review.
