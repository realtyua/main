# EL-4 — Notify: layout/host, config, captcha, endpoint

Phase: 5 · Depends: EL-2 · Repo: reifua
Branch: `feat/EL-4-notify-wiring` · Worktree: `../worktrees/EL-4-notify-wiring`

Status: `review`

## Goal

Сторінка оголошення рендерить notify-модалку через Form Engine: модальний HTML в layout, JSON-острівці (`notify-config`, `notify-page`), `app.js`, endpoint з сайту. Форма працює в режимі `behavior.mode: modal`, без wizard-хрому. Captcha (Turnstile) підключається через widget у конфігу.

## Files

- `src/_includes/layouts/default.njk` — додати notify-модалку (Bootstrap 4 modal markup) у `<body>`; підключення `bootstrap4.css` вже є для add-property, notify теж потребує Bootstrap
- `src/_includes/partials/notify-modal.njk` — **новий** пар셜 з модалкою (ID `#notifyModal`), куди `app.js` монтує форму
- `lib/form-engine.js` — додати `notifyEndpoint` в `ENDPOINTS`; передати `property_url`, `uid`, `property_email`, `property_title` через `endpointFor` або додаткові опції bake
- `src/_data/site.js` — `notifyEndpoint: 'https://notify-worker.sparkling-union-9e0a.workers.dev'`
- `src/_data/notify.yml` — **не змінювати** (тема вже `bootstrap4` через відсутність `theme` → дефолт; або явно `theme: bootstrap4`)
- `test/notify-page.test.mjs` — **новий**: перевірка модалки в layout, baked fragment, endpoint, captcha widget, відсутність Alpine

## Steps

1. `session_move` на `reifua/main` (`feature/form-engine`), worktree `../worktrees/EL-4-notify-wiring`, гілка `feat/EL-4-notify-wiring`, junction `node_modules`
2. Baseline: `npm test`, `npm run validate`, `npm run build` до змін
3. Створити `src/_includes/partials/notify-modal.njk` на основі Jekyll `_includes/modals/notify-property.html`:
   - Bootstrap 4 modal markup (`modal fade`, `modal-dialog modal-lg`, `modal-content`)
   - `#notify-app` з `data-endpoint` (з site data)
   - JSON-острівці: `notify-config` (bake), `notify-page` (dynamic page data: uid, property_url, property_email, property_title)
   - `<script type="module" src="/assets/js/form-engine/app.js?v=...">`
4. Підключити пар셜 у `default.njk` перед `</body>` (без умов — модалка потрібна на сторінках оголошень; може бути умовна по флагу front matter `notify: true`)
5. Оновити `lib/form-engine.js`:
   - Додати `notify` в `ENDPOINTS` з `SITE.notifyEndpoint`
   - При bake `notify` передавати `endpoint` і, за потреби, додаткові дані для `notify-page` island
6. Додати `notifyEndpoint` в `src/_data/site.js`
7. Створити `test/notify-page.test.mjs`: перевірка, що layout містить модалку, baked fragment має правильний endpoint, theme=bootstrap4, captcha widget, немає Alpine
8. Гейти item

## Acceptance

- `src/_includes/partials/notify-modal.njk` існує з правильним Bootstrap 4 modal markup
- `default.njk` включає пар셜 (безпосередньо або умовно)
- `npm run build` зелений; у виводі на сторінці оголошення (або тестовій) є:
  - `<div class="modal fade" id="notifyModal" ...>`
  - `<div id="notify-app" data-endpoint="https://notify-worker.sparkling-union-9e0a.workers.dev">`
  - `<script id="notify-config" type="application/json">` з `"theme":"bootstrap4"` (або дефолт)
  - `<script id="notify-page" type="application/json">` з `uid`, `property_url`, `property_email`, `property_title`
  - `<script type="module" src="/assets/js/form-engine/app.js?v=...">`
  - **немає** Alpine-атрибутів (`x-*`, `@*`, `:*`)
- `src/_data/notify.yml` не змінено
- Captcha widget (`turnstile_widget`) присутній у baked HTML
- Bootstrap-сторінка (`/new/`) не зламана
- Наявні тести reifua зелені (+ новий тест notify)

## Gates

`T` (reifua `npm test`), `V` (`npm run validate`), `B` (`npm run build`).

```powershell
npm test
npm run validate
npm run build
```

## Out of scope

- Passthrough + Tailwind purge — EL-5.
- Порт `check-add-property` — EL-6.
- Порт `check-notify` — EL-7.
- Freshness + parity-тест Jekyll ↔ 11ty — EL-8.
- Будь-які зміни рушія (`src/assets/js/form-engine/**`), схеми, валідатора.
- Повний Bootstrap JS (модалки рушій обробляє сам; потрібен лише CSS).
- Зміна `theme` у конфігу.

## Handoff log

**2026-11-09** — Status: `review` (ready for merge)
- Files created:
  - `src/_includes/partials/notify-modal.njk` — Bootstrap 4 modal partial with config/page JSON islands
  - `test/notify-page.test.mjs` — 21 new tests covering modal markup, shortcodes, baked config, page JSON, version, Alpine absence
- Files modified:
  - `src/_includes/layouts/default.njk` — conditional include of notify-modal on `notify: true`
  - `src/_includes/layouts/rental_entry.njk` — added `notify: true` front matter
  - `lib/form-engine.js` — added `notify` endpoint, `notifyConfigIsland`, `notifyPageJson`, `formEngineVersion` shortcodes, exposed `formEngineVersion` global
  - `src/_data/site.js` — added `notifyEndpoint`
  - `.eleventy.js` — added `jsonify` Nunjucks filter for safe JSON in script islands
- Gates run: `npm test` (239 pass), `npm run validate` (PASS), `npm run build` (PASS)
- Acceptance verified in `dist/apartment/penthouse/index.html`:
  - Modal markup with `#notifyModal`, `modal-dialog modal-lg`
  - `#notify-app` with `data-endpoint="https://notify-worker.sparkling-union-9e0a.workers.dev"`
  - `#notify-config` island with `"theme":"bootstrap4"`
  - `#notify-page` island with `uid`, `property_url`, `property_email`, `property_title`
  - `app.js?v=099fb082fd60` cache-busted loader
  - No Alpine attributes
  - Captcha widget (`turnstile_widget`) in baked config
  - Add-property (`/new/`) and demo pages unaffected
- `src/_data/notify.yml` unchanged
- Leftovers: none
- Commit SHA: (pending user commit)