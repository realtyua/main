# EL-3 — Demo-сторінка (Tailwind)

Phase: 5 · Depends: EL-1 · Repo: reifua
Branch: `feat/EL-3-demo-page` · Worktree: `../worktrees/EL-3-demo-page`

Status: `review`

## Goal

`src/demo.njk` рендерить `{% formApp "demo" %}` (тема `tailwind`), а
сторінка `/demo/` після `npm run build` містить робочу форму: запечений
фрагмент, JSON-острівці, `app.js` і Tailwind CSS. Форма не має endpoint
адреси (або має пусту/стабовану), бо це демонстраційна сторінка.

## Files

- `src/demo.njk` — **новий** сторінка demo: `{% formApp "demo" %}`,
  Tailwind-контейнер (`max-w-4xl mx-auto`), заголовок/опис — з `settings` конфігу.
- `lib/form-engine.js` — передати `endpoint` для `demo` (стаб `/api/demo` або
  пустий рядок; конфіг не знає про endpoint).
- `src/_data/site.js` — `demoEndpoint: '/api/demo'` (або видалити, якщо не
  потрібно; конфіг лишається site-agnostic).
- `test/demo-page.test.mjs` — **новий**: сторінка рендерить `demo`, тему
  `tailwind`, без Alpine-атрибутів, з правильним endpoint.

## Steps

1. `session_move` на `reifua/main` (`feature/form-engine`), worktree
   `../worktrees/EL-3-demo-page`, гілка `feat/EL-3-demo-page`,
   junction `node_modules` на `reifua/main/node_modules`.
2. Baseline: `npm test`, `npm run validate`, `npm run build` до змін.
3. Створити `src/demo.njk`: front matter з `layout: default`, `title`,
   `description` + `{% formApp "demo" %}` у Tailwind-контейнері.
4. Прокинути demo endpoint через `lib/form-engine.js` +
   `src/_data/site.js` (стаб `/api/demo`); переконатися, що `data-endpoint`
   у `dist/demo/index.html` присутній.
5. Додати тест сторінки: рендер `renderPage(config, opts)` дає `demo-form`,
   `demo-config`, `app.js`, `theme: tailwind`; у DOM немає `x-*`/`@*`/`:*`.
6. Гейти item.

## Acceptance

- `src/demo.njk` містить `{% formApp "demo" %}`.
- `npm run build` зелений; `dist/demo/index.html` містить:
  - `<form id="demo-form"`,
  - `<script id="demo-config" type="application/json">`,
  - `<script type="module" src="/assets/js/form-engine/app.js?v=...">`,
  - **немає** `<link rel="stylesheet" ... bootstrap4.css>`,
  - `data-endpoint="/api/demo"` (або стаб).
- У фрагменті немає Alpine-атрибутів (`x-*`, `@*`, `:*`).
- Конфіг `src/_data/demo.yml` не змінювався (тема вже `tailwind`).
- Bootstrap-сторінка (`/new/`) не зламана: build без помилок,
  `bootstrap4.css` підключається тільки там.
- Наявні тести reifua зелені (+ новий тест сторінки).

## Gates

`T` (reifua `npm test`), `V` (`npm run validate`), `B` (`npm run build`).

```powershell
npm test
npm run validate
npm run build
```

## Out of scope

- Notify: layout/host, config, captcha, endpoint — EL-4.
- Passthrough і Tailwind purge — EL-5.
- Порт `check-add-property` — EL-6.
- Порт `check-notify` — EL-7.
- Freshness + parity-тест Jekyll ↔ 11ty — EL-8.
- Будь-які зміни рушія (`src/assets/js/form-engine/**`), схеми, валідатора
  або `src/_data/demo.yml`.
- Зміна `theme` у конфігу.

## Handoff log

### 2026-11-09 — EL-3 done (review)

**Status:** `review` — gates green, awaiting user commit/merge.

**Files changed (reifua worktree `EL-3-demo-page`):**
- `src/demo.njk` — **new**, demo page rendering `{% formApp "demo" %}` in Tailwind container
- `lib/form-engine.js` — added `demo` endpoint to `ENDPOINTS` map (stub `/api/demo`)
- `src/_data/site.js` — added `demoEndpoint: '/api/demo'`
- `test/demo-page.test.mjs` — **new**, 3 assertions: page content, baked fragment (form, island, theme, app.js, endpoint, no Alpine in markup), layout gating

**Gates run (baseline + item):**
- `npm test` — 218/218 pass (baseline 215 + 3 new)
- `npm run validate` — `src/_data/add-property.yml: valid (schema version 1, id "add-property")`
- `npm run build` — green; `dist/demo/index.html` contains:
  - `<form id="demo-form" method="POST" novalidate autocomplete="off" data-form="demo">`
  - `<script id="demo-config" type="application/json">` with `"theme":"tailwind"`
  - `<script type="module" src="/assets/js/form-engine/app.js?v=...">`
  - **no** `<link rel="stylesheet" ... bootstrap4.css>` (only Tailwind `main.css`)
  - `data-endpoint="/api/demo"` (stub)
  - No Alpine attributes (`x-*`, `@*`, `:*`) in markup

**Leftovers / follow-ups:**
- EL-4: Notify wiring (layout/host, config, captcha, endpoint)
- EL-5: passthrough + Tailwind purge
- EL-6: port `check-add-property` (full copy-drift + file-info)
- EL-7: port `check-notify`
- EL-8: freshness + parity test Jekyll ↔ 11ty
- EL-9: full build + all gates

**Commit SHA:** a4d8570 (item commit), f0baf8e (merge --no-ff into feature/form-engine)

---

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->