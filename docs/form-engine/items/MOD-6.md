# MOD-6 — Відновити шлях до `captcha.js` у `head.html`

Phase: 8 · Depends: MERGE-2 · Repo: realtyua

Branch: `feat/MOD-6-captcha-path` · Worktree: `../worktrees/MOD-6-captcha-path`

Status: `todo`

> Окрема сесія. Помилка 404 існувала ще на feature-гілці, але проявилася
> на живому сайті лише після MERGE-2.

## Goal

Після item-а `new.html` і property-сторінки завантажують реальний captcha-рантайм,
`window.CaptchaSite` існує, Turnstile-віджет монтується й токен потрапляє в
payload форми. У консолі більше немає
`GET /assets/js/captcha.js?v=… net::ERR_ABORTED 404`.

## Причина (вже діагностовано)

- Коміт `178afaf8` перейменував `assets/js/captcha.js` →
  `assets/js/form-engine/captcha.js` без зміни вмісту.
- `_includes/head.html:178` лишився зі старим шляхом:
  `<script src="{{ '/assets/js/captcha.js' | relative_url }}?v=…">`.
- До мерджу `master` містив `assets/js/captcha.js`, тому 404 не було; після
  MERGE-2 файлу в HEAD немає.
- Наслідок не лише косметичний: `page-form.js` бере `window.CaptchaSite` і без
  нього не монтує віджет та не кладе токен у запит.

## Files

- `_includes/head.html` (рядок 178)

## Steps

1. Підтвердити в поточному HEAD: `git ls-tree HEAD --name-only assets/js/captcha.js`
   — порожньо; `assets/js/form-engine/captcha.js` існує.
2. Замінити шлях у `_includes/head.html:178` на
   `{{ '/assets/js/form-engine/captcha.js' | relative_url }}`, зберігши
   `?v={{ site.time | date: '%Y%m%d%H%M%S' }}`.
3. Перевірити порядок завантаження: `captcha.js` — звичайний script і має
   виконатися до модуля `app.js`, який читає `window.CaptchaSite`; тег
   `api.js?render=explicit` (рядок 179) у цьому item **не чіпати**.
4. Зібрати Jekyll і переконатися, що в згенерованому `new.html` шлях веде до
   `assets/js/form-engine/captcha.js`.
5. Після деплою (користувач) перевірити консоль `new.html`: 404 зник.
   Якщо лишився warning Turnstile — це MOD-7, тут не виправляти.
6. Гейти, handoff, локальний цикл після «прийнято».

## Acceptance

- [ ] `_includes/head.html` посилається на `assets/js/form-engine/captcha.js`
- [ ] Збірка 0; у рендері `new.html` новий шлях
- [ ] На живому сайті 404 `/assets/js/captcha.js` відсутній
- [ ] Гейти зелені

## Gates

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
node _form-engine/tools/check-notify.mjs
powershell -File _form-engine/tools/verify-render.ps1 build
```

`VR verify` не запускати — baseline перезахоплюється в MOD-8.

## Out of scope

- Зміни вмісту `assets/js/form-engine/captcha.js`
- Тег `https://challenges.cloudflare.com/turnstile/v0/api.js` (MOD-7)
- Перезахоплення baseline (MOD-8), MOD-4, push

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
