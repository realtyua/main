# EL-2 — Сторінка add-property + Bootstrap4 wiring

Phase: 5 · Depends: EL-1 · Repo: reifua
Branch: `feat/EL-2-add-property-page` · Worktree: `../worktrees/EL-2-add-property-page`

Status: `done`

## Goal

`src/new.njk` рендерить `{% formApp "add-property" %}` (тема `bootstrap4`), а
сторінка `/new/` після `npm run build` містить робочу форму: запечений
фрагмент, JSON-острівці, `app.js` і Bootstrap 4 CSS. Форма надсилається на
add-property endpoint, а не на поточний URL.

## Files

- `src/new.njk` — замінити demo-сторінку на add-property:
  `{% formApp "add-property" %}`, Bootstrap-сітка (`container`/`row`/`col-*`).
- `src/_includes/layouts/default.njk` — дати сторінці точку підключення
  додаткового CSS (наприклад, `{% block head %}{% endblock %}` або прапорець
  `bootstrap: true` у front matter).
- `src/assets/vendor/bootstrap4.css` — **новий**, вендорений Bootstrap 4.6 CSS
  (компільований локально з `realtyua/_sass/bootstrap/bootstrap.scss` через
  наявний Dart Sass 1.107.1; без мережі).
- `.eleventy.js` — `addPassthroughCopy` для `src/assets/vendor/bootstrap4.css`.
- `lib/form-engine.js` — передати `endpoint` для `add-property` з даних сайту
  (адаптер знає сайт; конфіг лишається site-agnostic).
- `src/_data/site.js` — `addPropertyEndpoint` (URL — site-специфіка, не
  `_data/*.yml`).
- `test/add-property-page.test.mjs` — **новий** (або розширення наявного
  `form-page.test.mjs`): сторінка рендерить `add-property`, тему `bootstrap4`,
  без Alpine-атрибутів.

## Steps

1. `session_move` на `reifua/main` (`feature/form-engine`), worktree
   `../worktrees/EL-2-add-property-page`, гілка `feat/EL-2-add-property-page`,
   junction `node_modules` на `reifua/main/node_modules`.
2. Baseline: `npm test`, `npm run validate`, `npm run build` до змін.
3. Згенерувати `src/assets/vendor/bootstrap4.css`:
   `sass --no-source-map realtyua/_sass/bootstrap/bootstrap.scss <out>`.
   Перевірити, що файл містить `.form-control`, `.row`, `.col-*`, `.custom-file`.
4. Додати passthrough для `src/assets/vendor/bootstrap4.css` у `.eleventy.js`.
5. Додати в `default.njk` умовне підключення Bootstrap CSS (прапорець front
   matter), не ламаючи Tailwind-сторінки.
6. Переписати `src/new.njk` на add-property: front matter з `form:
   add-property` (або прапорцем) + `{% formApp "add-property" %}` у
   Bootstrap-контейнері. Заголовок/опис — з `settings` конфігу або статичні.
7. Прокинути add-property endpoint через `lib/form-engine.js` +
   `src/_data/site.js`; переконатися, що `data-endpoint` у `dist/new/index.html`
   не порожній.
8. Додати тест сторінки: `dist` не потрібен — рендер `renderPage(config,
   opts)` дає `add-property-form`, `add-property-config`, `app.js`,
   `theme: bootstrap4`; у DOM немає `x-*`/`@*`/`:*`.
9. Гейти item.

## Acceptance

- `src/new.njk` містить `{% formApp "add-property" %}` і більше не рендерить
  `demo`.
- `npm run build` зелений; `dist/new/index.html` містить:
  - `<form id="add-property-form"`,
  - `<script id="add-property-config" type="application/json">`,
  - `<script type="module" src="/assets/js/form-engine/app.js?v=...">`,
  - `<link rel="stylesheet" ... bootstrap4.css>`,
  - `data-endpoint="https://…add-property…"` (не порожній, не `/new/`).
- У фрагменті немає Alpine-атрибутів (`x-*`, `@*`, `:*`).
- Конфіг `src/_data/add-property.yml` не змінювався (тема вже `bootstrap4`).
- Tailwind-сторінки (index, about, contacts) не зламані: build без помилок,
  `main.css` не регресує.
- Наявні тести reifua зелені (+ новий тест сторінки).

## Gates

`T` (reifua `npm test`), `V` (`npm run validate`), `B` (`npm run build`).
`CA` — повний порт `check-add-property` з'явиться в EL-6; для EL-2 достатньо
перевірки запеченого фрагмента в `dist/new/index.html`.

```powershell
npm test
npm run validate
npm run build
```

## Out of scope

- Demo-сторінка (Tailwind) — EL-3.
- Notify: layout/host, config, captcha, endpoint, `property_url` — EL-4.
- Passthrough і Tailwind purge — EL-5.
- Порт `check-add-property` — EL-6.
- Порт `check-notify` — EL-7.
- Freshness + parity-тест Jekyll ↔ 11ty — EL-8.
- Будь-які зміни рушія (`src/assets/js/form-engine/**`), схеми, валідатора
  або `src/_data/add-property.yml`.
- Повний Bootstrap JS (модалки рушій обробляє сам; потрібен лише CSS).

## Handoff log

### 2026-11-09 — EL-2 done (review)

**Status:** `review` — gates green, awaiting user commit/merge.

**Files changed (reifua worktree `EL-2-add-property-page`):**
- `.eleventy.js` — added passthrough copy for `src/assets/vendor/bootstrap4.css`
- `src/_includes/layouts/default.njk` — gated vendor stylesheet on front-matter `bootstrap: true`
- `src/new.njk` — repurposed from demo page to add-property: `bootstrap: true`, `{% formApp "add-property" %}`, Bootstrap grid (`container`/`row`/`col-md-8 offset-md-2`)
- `lib/form-engine.js` — added `ENDPOINTS` map and `endpointFor()`; passes `addPropertyEndpoint` from site data for `add-property` form
- `src/_data/site.js` — added `addPropertyEndpoint: 'https://add-property-worker.sparkling-union-9e0a.workers.dev'`
- `src/assets/vendor/bootstrap4.css` — **new**, compiled offline from `realtyua/_sass/bootstrap/bootstrap.scss` via Dart Sass 1.107.1 (188,762 bytes, UTF-8, only `@import` deprecation warnings)
- `test/add-property-page.test.mjs` — **new**, 3 assertions: page content, layout gating, baked fragment (form, island, theme, app.js, endpoint, no Alpine in markup)

**Gates run (baseline + item):**
- `npm test` — 215/215 pass (baseline 212 + 3 new)
- `npm run validate` — `src/_data/add-property.yml: valid (schema version 1, id "add-property")`
- `npm run build` — green; `dist/new/index.html` contains:
  - `<form id="add-property-form" method="POST" novalidate autocomplete="off" data-form="add-property">`
  - `<script id="add-property-config" type="application/json">` with `"theme":"bootstrap4"`
  - `<script type="module" src="/assets/js/form-engine/app.js?v=099fb082fd60"></script>`
  - `<link rel="stylesheet" href="/assets/vendor/bootstrap4.css">`
  - `data-endpoint="https://add-property-worker.sparkling-union-9e0a.workers.dev"` (non-empty, worker URL)

**Leftovers / follow-ups:**
- EL-3: demo page (Tailwind)
- EL-4: Notify wiring (layout/host, config, captcha, endpoint)
- EL-5: passthrough + Tailwind purge
- EL-6: port `check-add-property` (full copy-drift + file-info)
- EL-7: port `check-notify`
- EL-8: freshness + parity test Jekyll ↔ 11ty

**Commit SHA:** N/A (uncommitted, user will commit)

---
<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
