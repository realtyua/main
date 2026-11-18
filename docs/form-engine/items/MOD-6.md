# MOD-6 — Відновити шлях до `captcha.js` у `head.html`

Phase: 8 · Depends: MERGE-2 · Repo: realtyua

Branch: `feat/MOD-6-captcha-path` · Worktree: `../worktrees/MOD-6-captcha-path`

Status: `done`

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

### 2026-11-18 — сесія 1

- **Status:** `done` — огляд схвалено користувачем 2026-11-18; локальний цикл
  виконано: commit → merge `--no-ff` у `master` → cleanup worktree. Push —
  користувач.
- **Repo / branch / worktree:** `realtyua` · `feat/MOD-6-captcha-path` ·
  `../worktrees/MOD-6-captcha-path` (detached HEAD → гілка створена всередині,
  `node_modules` — junction на канонічний, `npm install` не запускався).
- **Files changed:**
  - `_includes/head.html` — рядок 178: шлях
    `/assets/js/captcha.js` → `/assets/js/form-engine/captcha.js` зі збереженням
    `?v={{ site.time | date: '%Y%m%d%H%M%S' }}`. Більше нічого не змінено.
  - `docs/form-engine/items/MOD-6.md` — цей handoff.
  - `docs/form-engine/WORKITEMS.md` — статус рядка MOD-6.
- **Перевірка зміни:**
  - У HEAD old-файлу немає; `assets/js/form-engine/captcha.js` існує (9164 B,
    матеріалізований локальним `npm run sync:form-engine` з пакета 1.0.4).
  - Збірка з тимчасовим override `turnstile_enabled: true` (як у CI; файл
    override видалено): у `_site/new.html` —
    `/assets/js/form-engine/captcha.js?v=…`, старого шляху немає; тег `api.js`
    (`?render=explicit`) не чіпався. По всьому `_site` 0 файлів зі старим
    шляхом і 2 з новим (`new.html` + property-сторінка).
  - Порядок завантаження: captcha.js — звичайний script у head (позиція 4492),
    `app.js` — module пізніше (286603), тобто `window.CaptchaSite` існує до boot.
  - UTF-8 без BOM перевірено.
- **Gates run (baseline до змін → item після):**
  - `npm test` — **227/228**, 1 failure: `form-app-fresh.test.mjs:24`
    (stale baked form). Ідентично на канонічному `main` @ `5f07b1c9`.
  - `validate-config` add-property / notify / demo — **3/3 valid**.
  - `check-add-property` — **4 failure(s)** (autocomplete main control /
    select / placeholder option / search hook). Ідентично на `main`.
  - `check-notify` — **ok (1 page)**; після build у складі `verify-render build`.
  - `verify-render.ps1 build` — **exit 0**: Jekyll build 0 (307 s,
    `--limit_posts 1`) + check-notify ok. `verify verify` не запускався (MOD-8).
- **Leftovers / поза scope:**
  - Дві застарілі розбіжності гейтів (stale baked form і 4 autocomplete) —
    наявні у `master`, не спричинені MOD-6. Потребуватимуть окремого ID,
    якщо їх треба закривати.
  - Jekyll build перезаписує трекований generated
    `_includes/form/app/add-property.html` (побічний ефект плагіна); відновлено
    з HEAD через `git checkout -- <file>` — у diff лишився тільки `head.html`.
  - Перевірку консолі на живому сайті (зникнення 404) робить користувач після
    деплою; warning Turnstile — MOD-7; перезахоплення baseline — MOD-8; push —
    користувач.
- **Commit SHA:** item `748ea138` (`MOD-6: restore captcha.js path in head.html`),
  merge `--no-ff` у `master` — `35da72b9`. Локальний цикл виконано після
  схвалення; `git push` навмисно не виконувався (завжди користувач).
  Мердж ішов у `master`, а не в `feature/form-engine` (затверджено користувачем):
  остання гілка на 5 комітів позаду і не є деплойною.

