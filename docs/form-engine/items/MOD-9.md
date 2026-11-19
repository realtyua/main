# MOD-9 — Captcha як engine-асет для modal-форми (notify)

Phase: 8 · Depends: MOD-7 · Repo: form-engine + realtyua
Branch: `feat/MOD-9-modal-captcha-assets` · Worktree: `../worktrees/MOD-9-modal-captcha-assets`

Status: `todo`

> Продовження MOD-7: після видалення site-level ін'єкції captcha зникла на
> property-сторінках, бо notify не проходить через `renderPage`. Цей item
> переводить notify на той самий engine-шлях, що й add-property.

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
- `test/render.test.mjs` + новий `test/modal-captcha.test.mjs`
- `package.json` → `1.1.0`, `CHANGELOG.md`

`realtyua`:

- `_data/notify.yml` — raw `<div id="turnstile-widget">` → `widget: captcha`
  (`element_id: turnstile`, `action: notify_property`)
- `_includes/modals/notify-property.html` — власні island + `app.js` замінити
  на `{% include form/app/notify.html %}` + island `notify-page`
- `package.json` / `package-lock.json` — `1.1.0` після публікації
- `docs/form-engine/items/MOD-9.md`, `docs/form-engine/WORKITEMS.md`

## Steps

1. У `form-engine`: baseline `npm test`.
2. Реалізувати `renderAssets` + `renderModal`, оновити `gen-form-app`,
   `check-notify`, тести; версія `1.1.0` + `CHANGELOG`; локальні гейти.
3. Користувач публікує `1.1.0` на npm (агент мережі не чіпає).
4. У `realtyua`: конфіг + інклюд + версія, `sync-form-engine`,
   `jekyll build --limit_posts 1`, `check-notify`, `npm test`.
5. Жива перевірка property-сторінки: captcha малюється, `api.js`/`captcha.js` —
   по одному запиту.
6. Handoff, реєстр, локальний цикл після «прийнято».

## Acceptance

- [ ] `notify.yml` оголошує captcha через `widget: captcha`, а не raw HTML
- [ ] Асети captcha емітуються один раз для page- і для modal-форми
- [ ] На сторінці без `widget: captcha` тегів captcha немає
- [ ] `check-notify` перевіряє відсутність дублів
- [ ] Версія пакета `1.1.0`, CHANGELOG оновлено
- [ ] На живій property-сторінці captcha працює, дубля `api.js` немає

## Gates

```powershell
# form-engine
npm test
npm test -- --test-name-pattern=captcha

# realtyua (після публікації 1.1.0)
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
- Публікація npm і оновлення `package-lock.json` — мережа, користувач

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-19: **item зареєстровано, статус `todo`.** Попередня сесія лише
  підготувала запис; реалізація — окрема сесія `/item MOD-9`.
