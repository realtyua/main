# MOD-7 — Turnstile: діагностувати подвійне завантаження `api.js`

Phase: 8 · Depends: MOD-6 · Repo: realtyua

Branch: `feat/MOD-7-turnstile-double-load` · Worktree: `../worktrees/MOD-7-turnstile-double-load`

Status: `todo`

> Окрема сесія. Старт — після MOD-6 і деплою: спершу треба перевірити, чи
> зник warning разом із 404 `captcha.js`.

## Goal

З'ясувати причину повідомлення
`[Cloudflare Turnstile] Turnstile already has been loaded. Was Turnstile imported multiple times?`
у консолі `new.html` і, якщо підтвердиться подвійне завантаження з боку
репозиторію, усунути його. Якщо причиною є кеш/навігація — закрити item
доказом без зміни коду.

## Відомі факти

- У репо рівно один статичний тег: `_includes/head.html:179`
  `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"></script>`.
- `head.html` підключається по разу в `_layouts/default.html`, `map.html`,
  `404.html`; `_layouts/owner.html` використовує окремий `owner/head.html`, де
  Turnstile немає.
- Рантайм `assets/js/form-engine/captcha.js` не інжектить `api.js`, а лише
  чекає `window.turnstile`.
- Безпосередньо підтвердити живий DOM локально неможливо (без мережі).

## Files

- `_includes/head.html` (ймовірно)
- рендер `_site/new.html` і property-сторінки — лише для інспекції

## Steps

1. Після MOD-6 і деплою перевірити, чи лишився warning у консолі `new.html`.
2. Зібрати Jekyll локально й порахувати в рендері:
   `turnstile/v0/api.js`, `/assets/js/form-engine/captcha.js`,
   `form-engine/app.js`.
3. Якщо тег `api.js` один — зафіксувати, що репо не завантажує API двічі;
   причина, імовірно, кешований старий JS або повторна навігація. Закрити item
   з цим висновком **без зміни коду**.
4. Якщо тегів два+ — знайти друге підключення (include/layout/module) і
   прибрати дубль.
5. Якщо підключення одне, але api.js виконується двічі через динамічний
   loader — додати guard `if (!window.turnstile)` перед інжектом/ініціалізацією.
6. Гейти, handoff, локальний цикл після «прийнято».

## Acceptance

- [ ] Причина warning-у backward-простежується ( один тег / дубль / dynamic loader )
- [ ] Або item закрито без змін із доказами, або подвійне завантаження усунуто
- [ ] На живому сайті `new.html` warning відсутній (перевіряє користувач)
- [ ] Гейти зелені

## Gates

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
powershell -File _form-engine/tools/verify-render.ps1 build
```

`VR verify` не запускати — див. MOD-8.

## Out of scope

- Зміна логіки капчі/токенів, MOD-4 (новий widget), MOD-6 (шлях уже виправлено)
- Перезахоплення baseline (MOD-8), push

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
