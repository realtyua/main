# JEK-E3 — Bootstrap4 render-тести до паритету з Tailwind

Phase: 4 · Depends: JEK-E2 · Repo: realtyua
Branch: `feat/JEK-E3-bootstrap4-render-parity` · Worktree: `../worktrees/JEK-E3-bootstrap4-render-parity`

Status: `review`

## Goal

Звести обидві теми до одного перевірюваного контракту: той самий конфіг дає
той самий набір `id` і `data-*`, кожен селектор glue знаходить елемент, chrome
перевіряється окремо від `FormRender.render`, а Tailwind проходить такий самий
jsdom-прогін `add-property`, як Bootstrap4. Після item-а регресія G-1 і дрейф
`BOOTSTRAP_TOKENS`/`HOOK_TOKENS` ловляться тестами, а не ручним оглядом.

Код рушія, теми, CSS, `_data/**`, `_includes/form/app/**` і baseline не
змінюються — item лише про тести.

Джерело рішень: `docs/form-engine/theme-neutral-hooks.md` §9.

## Files

Створюються:

- `test/theme-render-parity.test.mjs` — спільна render-матриця для
  `bootstrap4` і `tailwind`: поля, widgets, `id`/`data-*`-паритет, класові
  хуки, `chrome()`, `validationClasses`, відсутність Alpine і Bootstrap-
  утиліт у Tailwind.
- `test/theme-wire-parity.test.mjs` — jsdom (linkedom) прогін
  `_data/add-property.yml` для обох тем через `renderPage` + `bootPage`:
  таблиця «селектор glue → елемент», поведінка autocomplete/location,
  регресія G-1, локальний captcha-alert.

Змінюються:

- `test/render-tailwind.test.mjs` — узгодити `BOOTSTRAP_TOKENS` і
  `HOOK_TOKENS`: `alert-info` є нейтральним хуком captcha в обох темах;
  widget-контекст отримує явний allow-list, щоб тест не був хибно зеленим
  або хибно червоним.
- `docs/form-engine/items/JEK-E3.md` — spec + handoff (цей файл).
- `docs/form-engine/WORKITEMS.md` — рядок JEK-E3.

Читаються, але **не змінюються**:

- `assets/js/form-engine/**` (runtime, glue, теми, CSS) — контракт уже
  реалізовано в JEK-E2;
- `_data/add-property.yml`, `_form-engine/schema/**`, `_plugins/**`,
  `_includes/form/app/add-property.html`;
- `_form-engine/baseline/**`;
- `reifua/**` (EL-*).

## Steps

1. Worktree `JEK-E3-bootstrap4-render-parity`, гілка
   `feat/JEK-E3-bootstrap4-render-parity` (detached HEAD → `git checkout -b`).
2. Junction `node_modules` на `../../main/node_modules` (без `npm install`).
3. Baseline-гейти **до** будь-яких правок: `npm test`, три
   `validate-config --strict`, `check-add-property`.
4. `theme-render-parity.test.mjs`: репрезентативний конфіг з усіма типами
   полів і чотирма widgets прогнати обома темами. Перевірити однакові набори
   `id` і `data-*`, наявність нейтральних класових хуків в обох темах,
   відсутність Bootstrap-утиліт у Tailwind і Alpine в обох.
5. Там же — контракт `chrome(steps, copy)` для обох тем: `data-step-indicator`,
   рівно один `data-step-nav` і `data-step-title` на крок, `data-step-prev`,
   `data-step-next`, `data-submit`, `data-submit-label`, `data-submit-busy`,
   `data-submitted-block`, `data-error-block`; `navTokens` обох тем мають
   однакові ключі `current/done/todo` і непорожні списки класів (значення —
   презентаційні, тому не рівні).
6. Там же — `validationClasses` обох тем ідентичні; жодна тема не емітить
   Alpine-атрибутів.
7. `theme-wire-parity.test.mjs`: для кожної теми зібрати сторінку через
   `renderPage` (клон конфігу з відповідною темою), змонтувати в linkedom і
   завести `bootPage` зі стабами `setInterval`/`fetch`/`leaflet`/`Captcha`.
8. Таблиця «селектор glue → елемент» (з `page-form.js`/`binder.js`) для обох
   тем: `[data-field]`, `[data-field-group]`, `[data-location-field]`,
   `[data-location-search]`, `[data-location-dropdown]`,
   `[data-location-clear]`, `[data-location-summary]`,
   `[data-location-summary-panel]`, `[data-autocomplete-search]`,
   `[data-autocomplete-dropdown]`, `[data-autocomplete-clear]`,
   `[data-captcha-field]`, `[data-map-coords]`, `[data-map-fallback]`,
   `.custom-file`, `.custom-file-label`, `.file-previews`,
   `.position-relative`, `.location-search-icon`, `.autocomplete-search-icon`,
   `.captcha-widget`, `.alert`, `.alert-info`, `.map-marker-info`,
   `.invalid-feedback`, `.valid-feedback`, `[data-step-indicator]`,
   `[data-step-nav]`, `[data-step-title]`, `[data-step-prev]`,
   `[data-step-next]`, `[data-submit]`.
9. Поведінковий мінімум для обох тем: autocomplete відкриває dropdown з
   даними, пункти мають `dropdown-item`; вибір зберігає значення і ставить
   `theme.validationClasses.valid`; location summary panel перемикається;
   локальний captcha показує `.alert-info`.
10. Регресія G-1 в обох темах: `address` задано → `[data-map-fallback]`
    прихований; `address` порожній → fallback видимий.
11. `render-tailwind.test.mjs`: `alert-info` прибрати з
    `BOOTSTRAP_TOKENS` (це спільний хук captcha) і додати widget allow-list;
    після цього render-wide перевірка може включати captcha без хибних
    падінь. Bootstrap-only утиліти (`text-muted`, `img-fluid`, `form-group`,
    `spinner-border` у Bootstrap chrome тощо) і далі заборонені в
    Tailwind-виводі.
12. Прогнати item-гейти; переконатися, що змінені лише тестові й doc-файли.
13. Дописати handoff, оновити рядок у `WORKITEMS.md`.

## Acceptance

- Один і той самий конфіг у `bootstrap4` і `tailwind` дає ідентичні набори
  `id` і `data-*`; будь-який дрейф валить `theme-render-parity`.
- Обидві теми емітять нейтральні класові хуки, які селектить glue; Tailwind
  не містить Bootstrap-утиліт, Bootstrap4 не містить Alpine.
- `chrome()` обох тем проходить окремий контракт кроків, навігації й
  submit-блоків; `validationClasses` тем рівні, `navTokens` мають однакові
  ключі `current/done/todo` та непорожні списки класів (конкретні кольори —
  тематичні й навмисно різні, аудит §7).
- Для обох тем booted `add-property` сторінка задовольняє таблицю «кожен
  селектор glue знаходить елемент» — жодного пропуску.
- Tailwind wire-тест доводить: autocomplete dropdown відкривається й містить
  пункти, вибір зберігається, location summary panel і captcha-alert
  перемикаються так само, як у Bootstrap4.
- Регресія G-1: адреса є → fallback прихований; адреси немає → fallback
  видимий; в обох темах.
- `render-tailwind`: `alert-info` більше не вважається Bootstrap-протіканням;
  справжні Bootstrap-only токени далі валять тест.
- Усі item-гейти зелені; `git status` містить лише файли item-а; змінені й
  створені файли — UTF-8 без BOM.

## Gates

Плановий гейт item-а — `T`. `V` і `CA` — sanity, бо конфіги й рендер не
змінюються.

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
```

`VR` не запускається: runtime, теми, `_data`, `_includes`, `_plugins` і
baseline не змінюються. `CN`, `B`, `P` — поза scope item-а.

## Out of scope

- Будь-яка зміна runtime, glue, тем, CSS або конфігів — це JEK-E2.
- G-7 — host-контракт Bootstrap-модалки.
- Доступність (labels, aria, focus, keyboard) — JEK-E4.
- Повний build, README, `theming.md`, post-E2 блок аудиту — JEK-E5.
- `reifua` (11ty) — EL-*.
- Пере-захоплення `_form-engine/baseline/**`.
- Нові item-и або розширення контракту понад §9 аудиту.

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

### 2026-11-08 — session 1 (JEK-E3)

**Status:** `review`.

**Files changed (worktree, unstaged/untracked):**

- `test/theme-render-parity.test.mjs` (new) — спільна render-матриця обох тем:
  інтерфейс теми, паритет `id` і `data-*`, нейтральні класові хуки,
  відсутність Bootstrap-у Tailwind і Alpine в обох, контракт `chrome()`,
  `copy`/`navTokens`, `validationClasses`.
- `test/theme-wire-parity.test.mjs` (new) — booted `add-property` в linkedom
  для обох тем: таблиця «селектор glue → елемент», island `theme`/`nav`,
  autocomplete + G-1 + location summary, локальний captcha-alert.
- `test/render-tailwind.test.mjs` (modified) — `alert-info` прибрано з
  `BOOTSTRAP_TOKENS`, додано `WIDGET_HOOKS.captcha`, captcha включено в
  render-wide конфіг, додано тест widget-owned alert-хуків.
- `docs/form-engine/items/JEK-E3.md` — spec, уточнений acceptance про
  `navTokens`, цей handoff.
- `docs/form-engine/WORKITEMS.md` — рядок JEK-E3.

Runtime, теми, CSS, `_data/**`, `_includes/form/app/**`, `_plugins/**`,
`_form-engine/baseline/**` — без змін.

**Gates run:**

- `T` (`npm test`) — **228/228** (baseline до змін: 215/215).
- `V` (`validate-config --strict` × 3) — **3/3 valid**.
- `CA` (`check-add-property.mjs`) — **PASS**.
- `VR` — **не запускався**: render/теми/baseline не змінюються (див. Gates).

**Leftovers / notes:**

- `navTokens` Bootstrap4 і Tailwind навмисно різні за значеннями; тест
  закріплює однакові ключі `current/done/todo` і непорожні списки, а не
  рівність кольорів.
- `alert-info` у captcha — нейтральний хук `page-form.js`, не
  Bootstrap-протікання; allow-list `WIDGET_HOOKS.captcha` звужує виняток.
- Commit SHA — **немає**: зміни не закомічені, staging/commit/merge — за
  користувачем.
