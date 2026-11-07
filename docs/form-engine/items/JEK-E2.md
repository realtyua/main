# JEK-E2 — Реалізація theme-neutral hooks

Phase: 4 · Depends: JEK-E1 · Repo: realtyua
Branch: `feat/JEK-E2-theme-neutral-hooks` · Worktree: `../worktrees/JEK-E2-theme-neutral-hooks`

Status: `review`

## Goal

Закрити прогалини G-1..G-6 і G-8 з аудиту JEK-E1: підняти крихкі JS-зв'язки
до явних `data-*`-хуків, зробити стан валідності частиною інтерфейсу теми
(`theme.validationClasses`) і прибрати Bootstrap-утиліти з DOM, який будує glue.
Після item-а жоден runtime-селектор не залежить від презентаційного класу, а
обидві теми емітять однаковий контракт.

Джерело рішень: `docs/form-engine/theme-neutral-hooks.md` §6, §8.

## Files

Змінюються:

- `assets/js/form-engine/themes/bootstrap4.js` — G-1, G-3, G-5, G-6, G-8;
  `validationClasses` (G-2).
- `assets/js/form-engine/themes/tailwind.js` — те саме.
- `assets/js/form-engine/themes/bootstrap4.css` — G-4, G-5.
- `assets/js/form-engine/themes/tailwind.css` — G-4, G-5.
- `assets/js/form-engine/page-form.js` — G-1, G-2, G-3, G-4, G-5, G-6, G-8.
- `assets/js/form-engine/modal-form.js` — G-2 (передати `classes`).
- `assets/js/form-engine/binder.js` — лише коментарі (механізм `opts.classes`
  уже є).
- `_includes/form/app/add-property.html` — **regenerated** через
  `node _form-engine/tools/gen-form-app.mjs` (не редагувати руками).
- `_form-engine/baseline/**` — перезахоплення після перегляду кожної
  розбіжності (свідомий акт, не «лікування» гейта).
- `test/binder.test.mjs` — G-2: кастомні `classes`.
- `test/form-page.test.mjs` — fixture `data-step-indicator` (G-8).
- `test/render.test.mjs`, `test/render-tailwind.test.mjs` — нові `data-*` та
  відсутність `show`/Bootstrap-утиліт у glue-контракті.
- `docs/form-engine/items/JEK-E2.md`, `docs/form-engine/WORKITEMS.md`.

Читаються, але **не змінюються**:

- `_data/**`, `_form-engine/schema/**`, `_plugins/**`, `new.html`;
- `docs/form-engine/theme-neutral-hooks.md` (post-E2 блок — JEK-E5);
- `_form-engine/README.md`, `.opencode/skills/form-engine/references/theming.md`
  (JEK-E5);
- `reifua/main` (EL-*).

## Steps

1. Worktree `JEK-E2-theme-neutral-hooks`, гілка
   `feat/JEK-E2-theme-neutral-hooks` (detached HEAD → `git checkout -b`).
2. Junction `node_modules` на `../../main/node_modules` (без `npm install`).
3. Baseline-гейти **до** будь-яких правок: `npm test`, три
   `validate-config --strict`, `check-add-property`.
4. **G-1** — `data-map-fallback` на запасний `<div>` в обох темах; glue
   селектить `[data-map-fallback]` (`page-form.js:1885`). Класи лишаються
   презентацією.
5. **G-2** — `validationClasses: { invalid: 'is-invalid', valid: 'is-valid' }`
   в обох темах; `bindForm(form, controller, { classes: theme.validationClasses,
   colClass: theme.colClass })` у `page-form.js` і `modal-form.js`; усі
   літерали `'is-invalid'`/`'is-valid'` у glue замінити на поля теми,
   включно з `form.querySelector('.is-invalid')` (`page-form.js:260`).
6. **G-3** — `data-location-summary-panel` на обгортці панелі; glue селектить
   його напряму замість `closest('.mt-2')` (`page-form.js:739`). `mt-2`
   лишається лише відступом.
7. **G-8** — `data-step-indicator` на chrome-обгортці обох тем; glue
   `el('[data-step-indicator]')` (`page-form.js:112`). Клас лишається стилем.
8. **G-4** — glue будує file-preview лише з нейтральних хуків: `file-thumb`,
   `file-thumb-img`, `file-thumb-fallback`, `file-remove`. Прибрати `img-fluid`,
   `d-flex align-items-center justify-content-center bg-light text-muted`,
   `close position-absolute`. Доповнити CSS обох тем: фон/колір fallback,
   `position: absolute` і повний вигляд `.file-remove`.
9. **G-5** — замінити в glue `text-muted` → `dropdown-item-info`,
   `text-muted small` → `dropdown-item-tail`, `dropdown-item text-muted` →
   `dropdown-item dropdown-item-empty`; ті самі хуки в markup обох тем.
   Додати правила в обидва CSS; у `tailwind.css` — `.searchable-dropdown-item`
   і стилі tail/empty (site-SCSS для Bootstrap не чіпати).
10. **G-6** — прибрати `classList.toggle('show', …)` з `page-form.js` і `show`
    з dropdown-markup обох тем. Єдине джерело видимості — `style.display`.
11. Перегенерувати `_includes/form/app/add-property.html` штатним
    генератором; перевірити `test/form-app-fresh.test.mjs`.
12. Прогнати item-гейти (нижче). `VR`: переглянути кожну розбіжність
    (очікуються лише нові `data-*` і замінені hook-класи), після чого
    перезахопити baseline; повторний `verify` — зелений.
13. Дописати handoff, оновити рядок у `WORKITEMS.md`.

## Acceptance

- Обидві теми експортують `validationClasses` з тими самими дефолтами
  (`is-invalid`/`is-valid`); `page-form.js` і `modal-form.js` передають його в
  `bindForm`; у glue не лишилося літеральних `'is-invalid'`/`'is-valid'` поза
  CSS.
- `FormRender.render` для обох тем емітить `data-map-fallback`,
  `data-location-summary-panel`, `data-step-indicator`; жоден наявний `id` чи
  `data-*`-хук не перейменовано.
- Glue не містить `closest('.mt-2')`, `.is-invalid`-літерала, `.step-indicator`,
  `.map-marker-info-address.text-muted.font-italic`, `img-fluid`,
  `d-flex`/`bg-light`/`text-muted`/`position-absolute`/`close` у file-preview і
  dropdown-пунктах.
- Dropdown-пункти glue використовують `dropdown-item-info`,
  `dropdown-item-tail`, `dropdown-item-empty`; обидва CSS їх стилізують;
  `tailwind.css` має правила для `searchable-dropdown-item`.
- У theme-markup немає класу `show`, у glue — жодного `classList.toggle('show')`.
- `_includes/form/app/add-property.html` відповідає свіжому рендеру
  (`form-app-fresh` зелений).
- `id`/`data-*`-паритет `bootstrap4` ↔ `tailwind` збережений; `render-tailwind`
  зелений, Bootstrap-утиліти в Tailwind-рендер не проникають.
- Усі item-гейти зелені; кожна розбіжність `VR` переглянута й задокументована
  в handoff; baseline перезахоплено лише після цього.
- Змінені/створені файли — UTF-8 без BOM; `git status` містить лише файли
  item-а.

## Gates

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
powershell -File _form-engine/tools/verify-render.ps1 verify
powershell -File _form-engine/tools/verify-render.ps1 capture
powershell -File _form-engine/tools/verify-render.ps1 verify -SkipBuild
```

`CN` входить у `VR` (wrapper після build запускає `check-notify.mjs`);
окремо: `node _form-engine/tools/check-notify.mjs _site`. `B` і `P` — гейти
11ty (`reifua`), у цьому item-і не запускаються.

## Out of scope

- **G-7** — host-контракт Bootstrap-модалки (`d-none`, `was-validated`,
  `.modal`, `.hidden`); Tailwind-модалка — окремий item.
- **JEK-E3** — повний Bootstrap4/Tailwind wire-паритет; тест «кожен селектор
  glue знаходить елемент» і регресія G-1 у jsdom.
- **JEK-E4** — доступність (labels, aria, focus, keyboard).
- **JEK-E5** — README Phase 7c, `theming.md`, post-E2 блок в аудиті, повний build.
- `_data/**`, схема, `_plugins/**`, `new.html`, `reifua/**`.
- Будь-яке перейменування наявних `id`/`data-*` або зміна theme у конфігах.

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-07: Item створено з `_TEMPLATE.md` (spec-файл був відсутній); spec
  показано користувачу до будь-яких змін коду. Scope взято з
  `theme-neutral-hooks.md` §6/§8 (G-1..G-6, G-8). База — `realtyua/main`,
  гілка `feature/form-engine`, HEAD `bbaa52e7`, робоче дерево чисте.

- 2026-11-07: Реалізація завершена, статус `review`. Нічого не закомічено —
  усі зміни в робочому дереві worktree `JEK-E2-theme-neutral-hooks`.

  **Baseline до правок:** `T` 214/214, `V` 3/3 (`add-property`, `notify`,
  `demo`), `CA` PASS. Junction `node_modules` → `../../main/node_modules`,
  без `npm install`.

  **Що зроблено:**

  - **G-1** — `data-map-fallback` на fallback-`<div>` в обох темах;
    `page-form.js` селектить `[data-map-fallback]`.
  - **G-2** — обидві теми експортують
    `validationClasses = { invalid: 'is-invalid', valid: 'is-valid' }`;
    `page-form.js`/`modal-form.js` передають `classes` у `bindForm`; glue
    бере класи з теми, включно з пошуком першої помилки
    (`form.querySelector('.' + classes.invalid)`).
  - **G-3** — `data-location-summary-panel` на обгортці панелі; glue більше
    не робить `closest('.mt-2')`.
  - **G-4** — file-preview будується з хуків `file-thumb-img`,
    `file-thumb-fallback`, `file-remove`; Bootstrap-утиліти (`img-fluid`,
    `d-flex bg-light text-muted`, `close position-absolute`) з glue прибрані.
    CSS обох тем отримали фон/колір fallback і повний вигляд `.file-remove`
    (у Bootstrap — замість `.file-thumb .close`).
  - **G-5** — dropdown-пункти glue: `dropdown-item-info`,
    `dropdown-item-tail`, `dropdown-item-empty`; ті самі хуки в markup обох
    тем, правила в обох CSS, `.searchable-dropdown-item` у `tailwind.css`.
  - **G-6** — `show` прибрано з dropdown-markup обох тем і з
    `classList.toggle('show', …)` у glue; видимість — лише `style.display`.
  - **G-8** — `data-step-indicator` на chrome-обгортці обох тем; glue
    селектить `[data-step-indicator]`.
  - `_includes/form/app/add-property.html` перегенеровано
    `gen-form-app.mjs`; `test/form-app-fresh.test.mjs` зелений.

  **Файли (15 змінених + 1 новий):**

  `_includes/form/app/add-property.html`;
  `assets/js/form-engine/{binder,modal-form,page-form}.js`;
  `assets/js/form-engine/themes/{bootstrap4,tailwind}.{js,css}`;
  `test/{add-property-wire,binder,form-page,render-tailwind,render}.test.mjs`;
  `_form-engine/baseline/.render-baseline.json`,
  `_form-engine/baseline/new.html.txt`;
  `docs/form-engine/items/JEK-E2.md` (новий), `docs/form-engine/WORKITEMS.md`.

  **Item-гейти після змін:**

  - `npm test` — **215/215** (додано тест «both built-in themes expose the
    same validation class vocabulary» у `binder.test.mjs`).
  - `validate-config --strict` — 3/3 valid.
  - `check-add-property` — PASS.
  - `verify-render verify` — `check-notify: ok`; зміненим був лише
    `new.html`, два інші tracked-файли байт-ідентичні baseline.
  - `verify-render capture` → `verify -SkipBuild` — **PASS** (3/3
    byte-identical).
  - `B`/`P` (11ty/`reifua`) — поза scope item-а, не запускалися.

  **Перегляд розбіжностей `new.html` (усі — очікувані):**

  - `sha=` у маркері form-bake (єдине, що змінилося б і без G-правок).
  - inline CSS bootstrap4: нові правила `dropdown-item-info`/`-tail`/
    `-empty`; `.file-thumb-fallback` отримав `background-color`/`color`;
    `.file-thumb .close` → `.file-thumb .file-remove` з повним виглядом.
  - `data-step-indicator` на step-indicator.
  - `show` прибрано з 6 dropdown-menu (4 location + 2 autocomplete).
  - `text-muted` → `dropdown-item-empty` у 6 порожніх станах.
  - `data-location-summary-panel` на summary-обгортці.
  - `data-map-fallback` на fallback-адресі.
  - Жодних змін у `assets/data/form-config.json` і notify-сторінці
    (baseline байт-ідентичний).

  **Ліворуч / поза scope:** G-7 (host-контракт модалки), JEK-E3 (wire
  parity), JEK-E4 (a11y), JEK-E5 (docs + повний build). `_data/**`,
  схема, `_plugins/**`, `new.html`, `reifua/**` не змінювалися. Коміт не
  створювався — це робить користувач після перегляду.
