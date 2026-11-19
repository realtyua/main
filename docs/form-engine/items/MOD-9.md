# MOD-9 — Captcha як engine-асет для modal-форми (notify)

Phase: 8 · Depends: MOD-7 · Repo: form-engine + realtyua
Branch: `feat/MOD-9-modal-captcha-assets` · Worktree: `../worktrees/MOD-9-modal-captcha-assets` (form-engine); realtyua docs — `worktrees/brave-comet`

Status: `doing` (form-engine крок 2 виконано локально; кроки realtyua/npm — окрема сесія після публікації)

> Продовження MOD-7: після видалення site-level ін'єкції captcha зникла на
> property-сторінках, бо notify не проходить через `renderPage`. Цей item
> переводить notify на той самий engine-шлях, що й add-property.
>
> Узгодження 2026-11-19: ця сесія — **лише form-engine до кроку 2**, без npm
> publish і без змін у коді realtyua. Цільова версія пакета — **1.0.5** (замість 1.1.0).

## Goal

Будь-який конфіг із `widget: captcha` отримує `TURNSTILE_CONFIG`,
`captcha.js` і `api.js` рівно один раз — і для page-, і для modal-форм.
Notify працює через цей самий engine-шлях; site-level ін'єкцій немає.

## Files

`form-engine`:

- `runtime/shell.js` — винести спільний gate у `renderAssets(config, opts)`;
  додати `renderModal(config, opts)`: повний config island + асети + `app.js`
  без wizard-chrome і розмітки форми
- `adapters/jekyll/tools/gen-form-app.mjs` — бейкати modal-фрагмент, коли
  `behavior.mode: modal`
- `adapters/jekyll/tools/check-notify.mjs` — перевіряти 1×`TURNSTILE_CONFIG`,
  1×`captcha.js`, 1×`api.js`, наявність `widget: captcha` і відсутність дублів
- `test/render.test.mjs` (за потреби) + новий `test/modal-captcha.test.mjs`
- `package.json` / `package-lock.json` → `1.0.5`, `CHANGELOG.md`

`realtyua` (наступна сесія, після публікації 1.0.5):

- `_data/notify.yml` — raw `<div id="turnstile-widget">` → `widget: captcha`
  (`element_id: turnstile`, `action: notify_property`)
- `_includes/modals/notify-property.html` — власні island + `app.js` замінити
  на `{% include form/app/notify.html %}` + island `notify-page`
- `package.json` / `package-lock.json` — `1.0.5` після публікації
- `docs/form-engine/items/MOD-9.md`, `docs/form-engine/WORKITEMS.md`

## Steps

1. У `form-engine`: baseline `npm test`. **(виконано)**
2. Реалізувати `renderAssets` + `renderModal`, оновити `gen-form-app`,
   `check-notify`, тести; версія `1.0.5` + `CHANGELOG`; локальні гейти. **(виконано, локально)**
3. Користувач публікує `1.0.5` на npm (агент мережі не чіпає).
4. У `realtyua`: конфіг + інклюд + версія, `sync-form-engine`,
   `jekyll build --limit_posts 1`, `check-notify`, `npm test`.
5. Жива перевірка property-сторінки: captcha малюється, `api.js`/`captcha.js` —
   по одному запиту.
6. Handoff, реєстр, локальний цикл після «прийнято».

## Acceptance

- [ ] `notify.yml` оголошує captcha через `widget: captcha`, а не raw HTML
- [x] Асети captcha емітуються один раз для page- і для modal-форми (form-engine shell, локально)
- [ ] На сторінці без `widget: captcha` тегів captcha немає (перевірка в realtyua)
- [x] `check-notify` (package) перевіряє `widget: captcha` і відсутність дублів `TURNSTILE_CONFIG`/`captcha.js`/`api.js`/`app.js`
- [x] Версія пакета `1.0.5`, CHANGELOG оновлено (локально, без публікації)
- [ ] На живій property-сторінці captcha працює, дубля `api.js` немає

## Gates

```powershell
# form-engine (ця сесія)
npm test
npm test -- --test-name-pattern=captcha

# realtyua (наступна сесія, після публікації 1.0.5)
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
node _form-engine/tools/check-notify.mjs
powershell -File _form-engine/tools/verify-render.ps1 verify
```

## Out of scope

- 11ty-двійник (`reifua`) — окремий parity item після цієї версії
- CSP і консольний шум Cloudflare Turnstile — рішення користувача: не міняти
- MOD-8 (перезахоплення baseline), MOD-4, MOD-5
- Публікація npm і оновлення `package-lock.json` у залежних репо — мережа/користувач

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-19: **item зареєстровано, статус `todo`.** Попередня сесія лише
  підготувала запис; реалізація — окрема сесія `/item MOD-9`.
- 2026-11-19: **form-engine крок 2 (локально, прийнято).** Scope цієї
  сесії обмежено до form-engine; версія узгоджена як `1.0.5` (не `1.1.0`).
  Worktree: `C:\Users\Vasyl\Documents\GitHub\worktrees\MOD-9-modal-captcha-assets`
  (repo `form-engine`), гілка `feat/MOD-9-modal-captcha-assets` від `b5cf7b3`,
  `node_modules` — junction на `C:\Users\Vasyl\Documents\GitHub\form-engine\node_modules`.
  Файли змінено: `runtime/shell.js` (експорт `renderAssets` + `renderModal`,
  спільний captcha-gate), `adapters/jekyll/tools/gen-form-app.mjs` (bake modal
  при `behavior.mode: modal`), `adapters/jekyll/tools/check-notify.mjs`
  (вимога `widget: captcha`, рівно 1× `TURNSTILE_CONFIG`/`captcha.js`/
  Turnstile `api.js`/`app.js`), `test/modal-captcha.test.mjs` (новий),
  `package.json`, `package-lock.json`, `CHANGELOG.md` (`1.0.5`).
  **Gates (form-engine):** baseline `npm test` — 186/186 pass (до змін);
  після змін `npm test` — **190/190 pass**; `npm test -- --test-name-pattern=captcha`
  — запуск виконано, усі тести зелені (190/190 pass у повному прогоні).
  **Локальний цикл (після «прийнято», частково):** form-engine item commit
  `d3eaf9076c55e9b31ff8d1b33a54b287f494a1a9` (`d3eaf90`), merge `--no-ff` у
  `master` (form-engine) — `e919267df9f98082a3f6cf3f262f27794f1f7b65`; гілку
  видалено, worktree прибрано після зняття junction. Docs/реєстр realtyua —
  окремий локальний цикл у цьому ж сеансі (див. commit реєстру).
  **Leftovers:** npm publish `1.0.5` — користувач; кроки 3–5 realtyua
  (`_data/notify.yml`, `_includes/modals/notify-property.html`, sync/версії,
  build/gates, жива перевірка) — наступна сесія після публікації; 11ty parity —
  окремий item. Push — користувач. **Статус item:** `doing`. **Commit SHA:** `d3eaf90` (form-engine).
