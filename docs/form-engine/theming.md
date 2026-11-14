# Form Engine — Theming

Документ описує контракт теми, якій має відповідати кожна тема (Bootstrap 4, Tailwind, майбутні), як додати нову тему і які hook-и надає двигун.

> **Статус:** актуально для Phase 4 (JEK-E1..E4 завершено). Контракт включає `data-map-fallback`, `data-location-summary-panel`, `data-step-indicator`, `theme.validationClasses` (додано в JEK-E2).

---

## 1. Інтерфейс теми (`Theme`)

Кожна тема — ESM-модуль, що експортує об'єкт з полями:

```js
// assets/js/form-engine/themes/bootstrap4.js
// assets/js/form-engine/themes/tailwind.js
export default {
  name: 'bootstrap4',           // або 'tailwind'
  addon,                        // modal addon markup (Notify)
  chrome,                       // wizard chrome: { top, bottom }
  colClass,                     // CSS class for form columns (Bootstrap: 'col-12', Tailwind: 'w-full')
  controlAttrs,                 // function: (field, data) -> { class, ... }
  feedbackHtml,                 // function: (field, data) -> invalid/valid feedback HTML
  field,                        // function: (field, data) -> field wrapper HTML
  form,                         // function: (config, data) -> <form> wrapper HTML
  helperHtml,                   // function: (field, data) -> helper text HTML
  labelHtml,                    // function: (field, data) -> <label> HTML
  modals,                       // modal shells (Notify)
  navTokens,                    // step nav tokens for page glue (chips)
  requiredMarker,               // function: (field, data) -> required marker HTML
  validationClasses: {          // **JEK-E2** — theme-controlled validity classes
    invalid: 'is-invalid',
    valid: 'is-valid'
  },
  widget: {                     // widget shells
    captcha, map, location, price_info, autocomplete, file
  }
}
```

### `chrome(steps, copy)` → `{ top, bottom }`

Повертає wizard chrome (кроки, навігація, success/error блоки). `top` — заголовки кроків + кнопки prev/next; `bottom` — submit + error/success. Використовується `page-form.js` (`bootPage`).

### `navTokens`

Об'єкт з масивами класів для станів кроків:
```js
navTokens: {
  current: ['btn-primary'],     // активний крок
  completed: ['btn-success'],   // завершений
  pending: ['btn-secondary'],   // очікуваний
  error: ['btn-danger'],        // має помилку
  disabled: ['disabled']        // вимкнений
}
```
Glue (`page-form.js`) навішує ці класи на `[data-step-nav]` через config island.

### `validationClasses` (JEK-E2)

```js
validationClasses: { invalid: 'is-invalid', valid: 'is-valid' }
```
Використовується `binder.js` (`bindForm`) і glue для перемикання станів валідності. Дозволяє темі задавати власні імена класів (Tailwind може передати `border-red-500`/`border-green-500`).

---

## 2. Theme-neutral DOM hooks (контракт)

Ці `data-*` атрибути **емітяться обома темами** і **селектяться glue** — це стабільний контракт.

### Field-level

| Hook | Description | Source |
| --- | --- | --- |
| `data-field` | На кожному контролі (`input`, `select`, `textarea`) | `render.js` |
| `data-field-col` | На обгортці колонки поля | `render.js` |
| `data-field-group` | На обгортці групи (без значення) | `render.js` |
| `data-error` | На span для повідомлення помилки | `render.js` |
| `data-required-marker` | На маркері обов'язковості | `render.js` |
| `data-clear` | На кнопці очищення (icon-only) | `render.js` |
| `data-depends` | На полях/колонках з умовною видимістю | `render.js` |
| `data-toggle-for` | На radio/checkbox для toggle UI | `render.js` |

### Widget hooks

| Hook | Widget | Description |
| --- | --- | --- |
| `data-widget` | captcha, map, location, price_info | На обгортці віджета |
| `data-widget-name` | captcha, map, location, price_info | Ім'я віджета |
| `data-captcha-*` | captcha | `turnstile-box`, `retry`, `error`, `label` |
| `data-map-*` | map | `picker`, `coords`, `label` |
| `data-price-info` | price_info | На картці |
| `data-location-*` | location | `summary`, `dropdown`, `select`, `search` |
| `data-autocomplete-*` | autocomplete | `search`, `clear`, `icon` |
| `data-file-*` | file | `previews`, `preview`, `thumb`, `remove`, `info` |

### Chrome / Wizard (JEK-E2)

| Hook | Description |
| --- | --- |
| `data-step-nav` | Кнопка кроку в індикаторі |
| `data-step-title` | Заголовок кроку (tabindex=-1, фокус після next/prev) |
| `data-step-prev` / `data-step-next` | Кнопки навігації |
| `data-step-actions` | Контейнер дій (submit) |
| `data-step-spacer` | Роздільник |
| `data-step-indicator` | **JEK-E2** Обгортка індикатора кроків (glue селектить за цим) |
| `data-submit-*` | Submit-блоки: `block`, `btn`, `spinner`, `error-code`, `error-text` |
| `data-submitted-block` | Success-блок після сабміту |
| `data-error-block` / `data-error-text` | Error-блок |

### Accessibility / Runtime (JEK-E4)

| Hook | Description |
| --- | --- |
| `data-map-fallback` | **JEK-E2** Fallback-рядок адреси (приховується glue коли адреса є) |
| `data-location-summary-panel` | **JEK-E2** Панель location summary (замість випадкового `.mt-2`) |
| `aria-invalid` / `aria-describedby` | Ставятся binder/glue runtime |
| `aria-expanded` / `aria-activedescendant` | На combobox (autocomplete/location search) |
| `role="combobox"` / `role="option"` | Dropdown доступність |
| `aria-current="step"` | На поточному `[data-step-nav]` |
| `aria-live="polite"` | На `.invalid-feedback`, `.valid-feedback`, success/error/fallback блоках |

---

## 3. Класовий контракт (Class hooks)

Ці класи **емітяться обома темами** і **стилізуються обома CSS**. Glue може на них спиратися, але пріоритет — `data-*` хуки.

### Form / Field

| Class | Description |
| --- | --- |
| `invalid-feedback` / `valid-feedback` | Блоки повідомлень (aria-live) |
| `custom-file` / `custom-file-label` | File input wrapper |
| `file-previews` / `file-preview*` / `file-thumb*` / `file-list-info*` / `file-badge-compress` / `file-preview-notice` | File preview DOM (будовується glue) |
| `dropdown-menu` / `dropdown-item` / `highlighted` | Dropdown (widget + autocomplete) |
| `position-relative` | Обгортка search input |
| `location-search-icon` / `autocomplete-search-icon` | Декоративні іконки (aria-hidden) |
| `captcha-widget` / `alert` / `alert-info` | Captcha widget |
| `map-marker-info*` | Map picker shells |
| `is-invalid` / `is-valid` / `active` | **Runtime state** (тема задає імена через `validationClasses`) |
| `step-indicator` | Wizard step indicator (chrome) |

### Deprecated / Removed from glue (JEK-E2)

Ці Bootstrap-утиліти **більше не використовуються glue** для селектора — залишились лише в CSS презентації:

- `img-fluid` → прибрано з glue DOM
- `d-flex`, `align-items-center`, `justify-content-center`, `bg-light`, `text-muted` → прибрано з glue DOM
- `position-absolute` → прибрано з glue DOM (`.file-remove` має `position: absolute` в CSS)
- `text-muted small`, `searchable-dropdown-item` → замінено на семантичні хуки
- `.show` toggle → прибрано (visibility через `style.display`)

---

## 4. Як додати нову тему

1. **Створіть файл теми:** `assets/js/form-engine/themes/<name>.js`
   - Скопіюйте структуру з `bootstrap4.js` або `tailwind.js`
   - Реалізуйте всі функції інтерфейсу (див. §1)
   - Емітьте всі `data-*` хуки (§2) у розмітці
   - Емітьте всі класс-хуки (§3) у розмітці
   - Додайте `validationClasses` з власними іменами класів

2. **Створіть CSS:** `assets/js/form-engine/themes/<name>.css`
   - Стилізуйте всі класс-хуки з §3
   - Додайте `:focus-visible` для доступності (JEK-E4)
   - Стилізуйте `validationClasses.invalid` / `.valid`

3. **Зареєструйте тему в `render.js`:**
   ```js
   // assets/js/form-engine/render.js
   import bootstrap4 from './themes/bootstrap4.js';
   import tailwind from './themes/tailwind.js';
   import myTheme from './themes/my-theme.js'; // новий
   
   const themes = { bootstrap4, tailwind, 'my-theme': myTheme };
   ```

4. **Додайте тести:**
   - `test/render-<name>.test.mjs` — render parity (id, data-hooks, widget hooks)
   - `test/<name>-wire.test.mjs` — jsdom wire test (glue selectors find elements)

5. **Прогніть гейти:**
   ```bash
   npm test
   node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
   node _form-engine/tools/check-add-property.mjs
   powershell -File _form-engine/tools/verify-render.ps1 verify
   ```

---

## 5. CSS Tokens (BOOTSTRAP_TOKENS / HOOK_TOKENS)

Тести парсингу (`test/render-tailwind.test.mjs`) використовують два списки токенів:

- **BOOTSTRAP_TOKENS** — утиліти, що перекладаються (grid: `col-12`, `offset-md-3` → `w-full`, `md:w-1/2`, `md:ml-1/4`; spacing: `mt-2`, `mb-3` тощо).
- **HOOK_TOKENS** — клас-хуки, що **не** перекладаються, а проходять як є: `custom-file`, `dropdown-menu`, `alert`, `alert-info`, `file-previews`, `invalid-feedback`, `valid-feedback`, `captcha-widget`, `map-marker-info*`, `dropdown-item`, `highlighted`, `position-relative`, `location-search-icon`, `autocomplete-search-icon`, `step-indicator`, `is-invalid`, `is-valid`, `active`.

> **JEK-E3:** узгоджено — `alert-info` є в обох списках у різних контекстах (widget captcha vs chrome). Для widget-рендерів потрібен окремий allow-list.

---

## 6. Theme-neutral hooks — post-E2 status (from theme-neutral-hooks.md)

| Gap | Description | Status | Files |
| --- | --- | --- | --- |
| G-1 | Map fallback visible in Tailwind | **FIXED** (data-map-fallback) | `themes/*.js`, `page-form.js` |
| G-2 | `bindForm({classes})` unused | **FIXED** (validationClasses) | `themes/*.js`, `page-form.js`, `modal-form.js`, `binder.js` |
| G-3 | Location summary via `.mt-2` | **FIXED** (data-location-summary-panel) | `themes/*.js`, `page-form.js` |
| G-4 | Glue builds file-preview with BS utils | **FIXED** (neutral hooks + CSS) | `page-form.js`, `themes/*.css` |
| G-5 | Dropdown options mix neutral + BS | **FIXED** (dropdown-item-info/tail/empty) | `page-form.js`, `themes/*.css` |
| G-6 | `.show` toggle dead | **FIXED** (removed) | `page-form.js`, `themes/*.js` |
| G-7 | Modal glue = Bootstrap host | **EXEMPT** (host contract) | `modal-form.js`, `modals.js` |
| G-8 | `.step-indicator` class selector | **FIXED** (data-step-indicator) | `themes/*.js`, `page-form.js` |

---

## 7. Посилання

- `_form-engine/README.md` — архітектура, конвеєр, гейти
- `docs/form-engine/theme-neutral-hooks.md` — історичний аудит JEK-E1 (деталі по кожній прогалині)
- `assets/js/form-engine/themes/bootstrap4.js` / `tailwind.js` — референсні реалізації
- `test/render-tailwind.test.mjs` — parity тести
- `test/accessibility.test.mjs` — a11y контракт обох тем