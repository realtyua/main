# MOD-7 — Turnstile: діагностувати подвійне завантаження `api.js`

Phase: 8 · Depends: MOD-6 · Repo: realtyua

Branch: `feat/MOD-7-turnstile-double-load` · Worktree: `../worktrees/MOD-7-turnstile-double-load`

Status: `done`

> Окрема сесія. Старт — після MOD-6 і деплою: спершу треба перевірити, чи
> зник warning разом із 404 `captcha.js`.
>
> ⚠️ Діагноз сесії 1 (нижче: «репо завантажує `api.js` один раз») **спростовано**
> живими доказами сесії 2. Актуальний діагноз, фікс і гейти — у
> `### 2026-11-19 — сесія 2` в кінці файлу.

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

### 2026-11-19 — сесія 1

- **Status:** `review` — діагностика завершена: репо завантажує `api.js` один раз,
  подвійного завантаження з боку репо не підтверджено; код не змінювався
  (Step 3 item-а). Чекає огляду користувачем і живої перевірки консолі `new.html`.
- **Repo / branch / worktree:** `realtyua` · `feat/MOD-7-turnstile-double-load` ·
  `../worktrees/MOD-7-turnstile-double-load` (detached HEAD → гілка створена
  всередині, `node_modules` — junction на канонічний, `npm install` не запускався).
- **Files changed:** лише документи — `docs/form-engine/items/MOD-7.md` (цей
  handoff) і `docs/form-engine/WORKITEMS.md` (статус рядка MOD-7 → `review`).
  Виходного коду не змінено: за Step 3 подвійного інжекту з боку репо немає.
- **Діагностика (докази):**
  - Статика: `challenges.cloudflare.com/turnstile/v0/api.js` — рівно один тег,
    `_includes/head.html:179`. `head.html` включається по разу в
    `_layouts/default.html:12`, `_layouts/map.html:9`, `_layouts/404.html:6`;
    `_layouts/property.html` успадковує `default`. `new.html` має
    `form: add-property` і власного `<head>` не створює.
  - Історія: `git log --oneline -S 'turnstile/v0/api.js'` — єдиний коміт, що
    змінив кількість входжень у site-файлах, `f8766473` (0 → 1); другого тегу
    в історії не було.
  - Рантайм: `assets/js/form-engine/captcha.js` лише читає `window.turnstile`
    (рядки 88, 139, 145, 154, 178, 224, 258); у всьому
    `assets/js/form-engine/**` немає ані `document.createElement('script')`,
    ані присвоєння `window.turnstile`. Іншого `api.js` (статичного чи
    динамічного) у репо немає — Step 5 не застосовується.
  - Рендер: тимчасовий override `_config.mod7.yml` з `turnstile_enabled: true`
    (еквівалент CI; файл видалено після збірки) → `_site/new.html`: 1 `<head>`,
    1 `api.js?render=explicit`, 1 `/assets/js/form-engine/captcha.js`,
    1 `/assets/js/form-engine/app.js`, 0 старих `/assets/js/captcha.js`. По
    всьому `_site` лише 2 файли містять `api.js` — `new.html` і одна
    property-сторінка — по одному входженню кожен.
  - Висновок: репо не інжектить `api.js` двічі. Warning, якщо він лишився на
    живому сайті, має зовнішню причину — кешований старий JS / повторна
    навігація (BFCache) / розширення браузера / інжект на боці Cloudflare.
- **Gates run (baseline до змін → item після):**
  - `npm test` — **227/228**, 1 failure `form-app-fresh.test.mjs:24` (stale baked
    form); ідентично до baseline і MOD-6, не спричинено MOD-7.
  - `validate-config` add-property / notify / demo — **3/3 valid**.
  - `check-add-property` — **4 failure(s)** (autocomplete main control / select /
    placeholder option / search hook); ідентично до baseline і MOD-6.
  - `check-notify` — **ok (1 page)**.
  - `verify-render.ps1 build` — **exit 0** і на baseline (329 s), і після
    docs-правок (310 s): Jekyll build 0 (`--limit_posts 1`) + check-notify
    ok (1 page). `verify verify` не запускався (MOD-8).
  - Діагностичний build з override — exit 0 (341 s), використаний лише для
    підрахунку тегів у рендері.
- **Leftovers / поза scope:**
  - Жива перевірка консолі `new.html` після деплою MOD-6 — за користувачем
    (acceptance-критерій). Якщо warning лишився — причина поза трекованим
    кодом; новий ID лише якщо буде доведено репо-сторону.
  - Дві наявні розбіжності гейтів (stale baked form і 4 autocomplete) — не
    MOD-7, залишено без змін.
  - Побічний ефект Jekyll-build на трекований generated
    `_includes/form/app/add-property.html` відновлено з HEAD; тимчасовий
    `_config.mod7.yml` видалено. У diff — лише два docs-файли.
- **Commit SHA:** — (коміт не створювався за інструкцією; усі зміни в робочому
  дереві, огляд користувачем попереду).

### 2026-11-19 — сесія 2 (фікс; актуальний діагноз)

- **Status:** `done` — огляд схвалено користувачем 2026-11-19; локальний цикл
  виконано: commit → merge `--no-ff` у `master` → cleanup worktree. Push —
  користувач. Step 4 item-а підтверджено живими доказами, дубль усунуто.
- **Живі докази (Network + View Source, інкогніто без розширень):**
  - `api.js?render=explicit` — 2 запити; `captcha.js` — 2 запити з різними
    версіями: `?v=20261119002155` (`site.time` з `head.html`) і
    `?v=a9cb0509cac8` (`engineDigest` зі згенерованого фрагмента);
    `app.js?v=a9cb0509cac8`.
  - View Source `new.html`: у HEAD — `captcha.js?v=20261119002155` і `api.js`;
    у BODY, у згенерованому фрагменті форми, — `captcha.js?v=a9cb0509cac8` і
    `api.js`. Warning у консолі лишається навіть в інкогніто.
- **Корінь:** два незалежні інжекти тих самих тегів:
  - `_includes/head.html:154-180` — за `page.form == 'add-property'` або
    `page.layout == 'property'`, версія `?v={{ site.time }}`;
  - `assets/js/form-engine/shell.js:72-84,144-146` — `turnstileBlock()` у
    запеченому фрагменті (`_form-engine/tools/gen-form-app.mjs:32,83`),
    версія `?v=<engineDigest>`. Gate: `turnstile.enabled && flags.captcha`;
    `flags.captcha` ставиться з `_data/add-property.yml:1224`
    (`widget: captcha`), `turnstile.enabled` приходить із `_config.yml`
    (`site-opts.mjs:123`); у CI він `true`.
  - Read-only рендер `renderPage()` з `turnstile.enabled: true` дав
    `SCRIPTS=2` (`captcha.js?v=a9cb0509cac8`, `api.js?render=explicit`) —
    саме той другий набір, що у BODY.
- **Фікс (Варіант A, схвалено користувачем):** з `_includes/head.html`
  видалено блок `TURNSTILE_CONFIG` + `captcha.js` + `api.js`; натомість лишився
  короткий коментар, що асети належать `@realtyua/form-engine` і емітуються
  запеченим фрагментом за наявності `widget: captcha`. Пакет і фрагмент
  не змінювалися.
  - Чому не B: `shell.js` — gitignored і копіюється з
    `@realtyua/form-engine@1.0.4` через `scripts/sync-form-engine.mjs:20-24`
    під час `npm ci` (postinstall у CI), тож локальна правка не довговічна.
    B ще й лишав би власником сайт, суперечачи принципу «асети керуються
    конфігом форми».
- **Паритет із 11ty (лише читання):** там той самий `renderPage`, але адаптер
  не передає `turnstile`, а в YAML немає блоку `captcha:` — gate ніколи не
  спрацьовує; notify і там оголошує `type: raw` без асетів. Site-level дубля
  й дедуп-гарда немає. Це окремий parity-розрив, не MOD-7.
- **Верифікація після фіксу:**
  - CI-еквівалент (`_config.yml` тимчасово `turnstile_enabled: true`, потім
    відновлено з bytes-backup): `jekyll build --limit_posts 1` — exit 0;
    `_site/new.html`: `api.js?render=explicit` = **1**, `captcha.js` = **1**,
    `TURNSTILE_CONFIG` = **1**, усі в BODY. До фіксу було по 2 (HEAD + BODY).
  - Оверрайд через `--config _config.yml,_config.mod7.yml` дав 0 тегів:
    `site-opts.mjs:107` читає `_config.yml` з диска, тож Jekyll-оверрайд до
    бейка не доходить; це додатково підтвердило, що `head.html` більше нічого
    не інжектить. Тимчасовий `_config.mod7.yml` видалено.
- **Гейти (після фіксу):**
  - `npm test` — **227/228**, 1 failure `form-app-fresh.test.mjs:24`
    (stale baked form); ідентично до baseline, MOD-6 і сесії 1.
  - `validate-config` add-property / notify / demo — **3/3 valid**.
  - `check-add-property` — **4 failure(s)** (autocomplete); ті самі, що baseline.
  - `check-notify` — **ok (1 page)**.
  - `verify-render.ps1 build` — **exit 0** (`--limit_posts 1`, ~307 с) +
    check-notify ok. `verify verify` не запускався (MOD-8).
- **Files changed:** `_includes/head.html`, `docs/form-engine/items/MOD-7.md`
  (цей handoff), `docs/form-engine/WORKITEMS.md`. Згенерований
  `_includes/form/app/add-property.html` відновлено з HEAD після build;
  `_config.yml` відновлено (`turnstile_enabled: false`). Усі три файли —
  UTF-8 без BOM.
- **Залишки / поза scope:**
  - **Notify:** на `property`-сторінках captcha тепер не підключається, бо
    `notify.yml:154-156` оголошує `type: raw` із `<div id="turnstile-widget">`,
    а не `widget: captcha`, і модалка не проходить `renderPage`.
    `modal-form.js:125` (`if (!Captcha) return`) просто пропустить монтаж.
    Повна уніфікація вимагає нової версії `@realtyua/form-engine`
    (gate → тільки `flags.captcha`, емісія асетів для modal-конфігів) і
    переведення `notify.yml` на `widget: captcha` — **новий ID**.
  - Жива перевірка консолі `new.html` після деплою — за користувачем.
  - Дві відомі розбіжності гейтів (stale baked form, 4 autocomplete) —
    не MOD-7, без змін.
- **Commit SHA:** item `08ca1244` (`MOD-7: remove duplicate Turnstile
  injection from head.html`), merge `--no-ff` у `master` — `a73eaabf`.
  Локальний цикл виконано після схвалення; `git push` навмисно не
  виконувався (завжди користувач). Мердж ішов у `master`, а не в
  `feature/form-engine` (затверджено користувачем): остання гілка позаду
  і не є деплойною.
