# JEK-E4 — Доступність: labels, aria, focus, keyboard

Phase: 4 · Depends: JEK-E3 · Repo: realtyua
Branch: `feat/JEK-E4-accessibility` · Worktree: `../worktrees/JEK-E4-accessibility`

Status: `todo`

## Goal

Зробити обидві теми (`bootstrap4`, `tailwind`) доступними на базовому рівні:
кожен контрол має доступну назву, стан валідності й відкриті списки озвучуються
через ARIA, фокус переходить на зміну кроку та на результат/помилку сабміту,
а пункти dropdown керуються з клавіатури, а не лише мишею. Після item-а
`test/accessibility.test.mjs` ловить регресії цих гарантій для обох тем.

Джерело рішень: `docs/form-engine/theme-neutral-hooks.md` §10 і спостереження
JEK-E1/E2/E3. Код рушія й теми змінюються **тільки** в межах a11y; `_data/**`,
схема, `_plugins/**` і baseline не змінюються.

## Files

Створюються:

- `test/accessibility.test.mjs` — a11y-контракт обох тем: доступні назви,
  `fieldset`/`legend` для radio, `aria-invalid`/`aria-describedby`,
  `aria-expanded`/`aria-activedescendant`, `aria-current="step"`, live-регіони,
  фокус після кроку/сабміту, клавіатурна активація пунктів dropdown.
- `docs/form-engine/items/JEK-E4.md` — spec + handoff (цей файл).

Змінюються:

- `assets/js/form-engine/themes/bootstrap4.js` — radio-група як
  `fieldset`/`legend`; `aria-label` для icon-only кнопок очищення; декоративні
  SVG/спінери `aria-hidden`; live/status-атрибути на блоках feedback,
  success і error; `tabindex="-1"` на заголовках кроку та success/error.
- `assets/js/form-engine/themes/tailwind.js` — те саме в Tailwind-розмітці.
- `assets/js/form-engine/binder.js` — `aria-invalid` на контролах у
  `syncField`; зв'язок контрола з блоком помилки через runtime-призначений
  `id` + `aria-describedby` (без нових статичних `id`).
- `assets/js/form-engine/page-form.js` — `aria-current` для поточного кроку;
  `aria-expanded`/`aria-activedescendant` для combobox; keyboard-активація
  пунктів autocomplete/location; `aria-label` на `.file-remove` з іменем файлу;
  фокус на заголовок кроку після next/prev; фокус на error/success-блок після
  сабміту; live-озвучення map fallback і captcha-статусу.
- `assets/js/form-engine/themes/bootstrap4.css` — видимий `:focus-visible`
  ring для кнопок/контролів, які його не мають.
- `assets/js/form-engine/themes/tailwind.css` — те саме для Tailwind.
- `_includes/form/app/add-property.html` — **regenerated** через
  `_form-engine/tools/gen-form-app.mjs` (маркер `form-bake` і sha
  оновляться). Руками не редагується.
- `docs/form-engine/WORKITEMS.md` — рядок JEK-E4.

Читаються, але **не змінюються**:

- `_data/add-property.yml`, `_data/notify.yml`, `_data/demo.yml`;
- `_form-engine/schema/**`, `_form-engine/tools/**`, `_plugins/**`;
- `_form-engine/baseline/**`;
- `reifua/**` (EL-*).

## Steps

1. Worktree `JEK-E4-accessibility`, гілка `feat/JEK-E4-accessibility`
   (detached HEAD → `git checkout -b`).
2. Junction `node_modules` на `../../main/node_modules` (без `npm install`).
3. Baseline-гейти **до** будь-яких правок: `npm test`, три
   `validate-config --strict`, `check-add-property`.
4. Labels / доступні назви:
   - radio-групу в обох темах загорнути у `fieldset` + `legend` (заголовок
     поля більше не є `<label>` без контрола); per-option `<label for>` вже є —
     лишити;
   - icon-only кнопки очищення (`btn-clear`, `autocomplete-clear`,
     `location-clear`) отримують `aria-label` (текст лишається в `title`);
   - `.file-remove` отримує runtime `aria-label` з іменем файлу;
   - декоративні іконки (map-marker SVG, search-icon) — `aria-hidden="true"`
     і `focusable="false"`; спінер, що має `role="status"`, лишається зі
     `sr-only`-текстом.
5. ARIA-стан:
   - `binder.syncField` ставить `aria-invalid="true|false"` на контрол;
   - блоки `.invalid-feedback`/`.valid-feedback` отримують
     `aria-live="polite"` (і `aria-atomic="true"`), а контрол — runtime
     `aria-describedby` на свій error-блок; статичні `id` не додаються
     (див. нижче);
   - dropdown-и autocomplete/location: search-input стає `role="combobox"`,
     `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`; пункти —
     `role="option"` + `aria-selected`; підсвічений пункт — через
     `aria-activedescendant` (усі `id` призначаються в runtime);
   - поточний `[data-step-nav]` отримує `aria-current="step"` у `syncChrome`;
   - блок помилки сабміту вже має `role="alert"` — лишити; success-блок
     отримує `role="status"`/`aria-live="polite"`;
   - map fallback (`[data-map-fallback]`) і локальний captcha-статус
     озвучуються (`role="status"`/`aria-live="polite"`), а не лише ховаються;
   - captcha-box отримує `aria-labelledby` на наявний `label_<name>` **в
     runtime**, щоб не ламати точний regex `check-add-property`.
6. Focus management:
   - після `next`/`prev` фокус переходить на видимий `[data-step-title]`
     (`tabindex="-1"`), а не тільки `scrollIntoView`;
   - після помилки сабміту фокус — на error-блок; після успіху — на
     success-блок;
   - `focusFirstInvalid` лишається, але не перебиває новий фокус;
   - у CSS обох тем додати видимий `:focus-visible` для `.btn-clear`,
     `.file-remove`, `.step-number` (де це доречно) і контролів без
     Bootstrap/Tailwind ring.
7. Keyboard:
   - пункти autocomplete/location dropdown активуються з `click` (Enter/Space
     на `<button>`), не лише з `mousedown`; mouse-поведінка не ламається;
   - переконатися, що ArrowUp/ArrowDown/Enter у search-input працюють як
     раніше і синхронізують `aria-activedescendant`;
   - Escape закриває dropdown (якщо вже є — закріпити тестом; якщо ні —
     додати в межах item-а).
8. Regenerate `_includes/form/app/add-property.html`:
   `node _form-engine/tools/gen-form-app.mjs`. Переконатися, що
   `test/form-app-fresh.test.mjs` зелений.
9. `test/accessibility.test.mjs` — для кожної теми зібрати `add-property`
   через `renderPage`, змонтувати в linkedom, завести `bootPage` зі стабами
   (як у `theme-wire-parity`) і перевірити:
   - кожен `input`/`select`/`textarea` має доступну назву;
   - radio-група — `fieldset`/`legend`;
   - icon-only кнопки мають `aria-label`/`title`;
   - декоративні іконки `aria-hidden`;
   - `aria-invalid` і `aria-describedby` після валідації;
   - `aria-expanded`/`aria-activedescendant`/`role=option` на dropdown;
   - `aria-current="step"` рівно на одному кроці;
   - success/error/fallback — live-регіони;
   - keyboard-активація пункту dropdown змінює значення;
   - фокус переходить на заголовок кроку та на error/success.
10. Прогнати item-гейти; переконатися, що змінені лише файли item-а.
11. Дописати handoff, оновити рядок у `WORKITEMS.md`.

## Acceptance

- В обох темах кожен контрол має доступну назву; radio-група має
  `fieldset`/`legend`; icon-only кнопки мають `aria-label`.
- `aria-invalid` відображає реальний стан валідності, а error-блок
  асоційований із контролом; статичних `id` не додано.
- Dropdown обох themes: `role="combobox"`, `aria-expanded`,
  `aria-activedescendant`, пункти `role="option"` з `aria-selected`;
  активація з клавіатури працює.
- `aria-current="step"` стоїть рівно на поточному кроці; success/error/
  map-fallback озвучуються як live-регіони.
- Після next/prev фокус на заголовку кроку; після сабміту — на
  error/success-блоці.
- `.file-remove` має доступну назву з іменем файлу.
- `test/accessibility.test.mjs` зелений для `bootstrap4` і `tailwind`;
  `theme-render-parity` і `theme-wire-parity` не регресували.
- Baked `_includes/form/app/add-property.html` свіжий; `form-app-fresh`
  зелений.
- Усі item-гейти зелені; `git status` містить лише файли item-а; змінені й
  створені файли — UTF-8 без BOM.

## Gates

Плановий гейт item-а — `T`. `V` і `CA` — sanity: конфіги не змінюються, але
`CA` перевіряє, що a11y-розмітка не зламала id/copy-контракт.

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
```

`VR` не запускається: повний build і перезахоплення baseline — JEK-E5.
`CN`, `B`, `P` — поза scope item-а.

## Out of scope

- Повний build, `_form-engine/README.md`, `theming.md` і post-E2 блок аудиту —
  JEK-E5.
- Пере-захоплення `_form-engine/baseline/**` і `verify-render`.
- Зміна конфігів, схеми, `_plugins/**`, `site-opts.mjs`.
- Нові статичні `id` у рендері (їх забороняє `check-add-property`); усе, що
  потребує `id`, призначається в runtime.
- Зміна theme-neutral hooks або класового контракту — JEK-E2.
- `reifua` (11ty) — EL-*.
- Повний WCAG-аудит, контрастність кольорів і переклад ARIA-текстів.

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-08: Item створено з `_TEMPLATE.md` (spec-файл був відсутній).
  Специфікацію показано користувачу для затвердження до будь-яких змін коду.
  База — `realtyua/main`, гілка `feature/form-engine`, HEAD `78a3408e`,
  робоче дерево чисте. Worktree/гілка ще не створювалися.
