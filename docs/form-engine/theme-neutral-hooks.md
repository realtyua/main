# Theme-neutral DOM hooks — аудит

Item: **JEK-E1** · Дата: 2026-11-07 · Гілка: `feat/JEK-E1-theme-hooks-audit`
Фаза: 4 · Залежність: JEK-R7
Обсяг: **аудит без зміни коду** — рушій, теми, тести, конфіги й baseline не
зачеплені.

Документ відповідає на чотири питання:

1. На які класові селектори реально спираються runtime/glue, теми, CSS і тести?
2. Які з них є theme-neutral контрактом, а які — презентацією теми або
   Bootstrap-протіканням?
3. Чи живий ще «tailwind `.form-group` crash» із Phase 7c?
4. Що конкретно має зробити JEK-E2, а що — JEK-E3/E4/E5?

---

## 1. Короткий висновок

- **`.form-group` crash закритий у Phase 7a/7b.** Жоден рядок
  `assets/js/form-engine/*.js` не шукає `.form-group`; glue ходить по
  `[data-field-group]`. Tailwind емітить `mb-4` (`themes/tailwind.js:39`), а
  `test/render-tailwind.test.mjs:28,113-114` явно забороняє `form-group` у
  Tailwind-рендері. Рядок `_form-engine/README.md:259` зі статусом `pending`
  застарілий — це робота для **JEK-E5**, а не відкритий дефект.
- **`data-*`-паритет повний.** Для `add-property`, `notify` і `demo` набори
  `id` та всіх `data-*`-хуків у `bootstrap4` і `tailwind` збігаються
  (див. §4).
- **Класовий контракт майже повний.** Усі класи, які glue/CSS справді
  потребують, обидві теми емітять. Виняток — **G-1** (map fallback):
  Tailwind емітить `text-gray-500 italic`, а glue шукає
  `.map-marker-info-address.text-muted.font-italic`, тому запасний текст
  «Адресу не вдалося визначити» ніколи не ховається.
- **Знайдено 8 прогалин:** 1 функціональна (G-1, risk), 3 крихкі зв'язки
  (G-2, G-3, G-8), 3 косметичні (G-4, G-5, G-6) і 1 явний host-контракт
  (G-7, exempt). Blocker-ів немає.
- **Рекомендація для JEK-E2:** підняти чотири JS-зв'язки до явних `data-*`
  хуків (`data-map-fallback`, `data-location-summary-panel`,
  `data-step-indicator`, `theme.validationClasses`) і прибрати
  Bootstrap-утиліти з DOM, який будує glue.

---

## 2. Метод і його межі

Аудит спирався на два незалежні джерела, бо жодне з них окремо не покриває
всю картину.

**A. Статичний інвентар.** Регулярним виразом зібрано кожен літеральний
класовий селектор у `assets/js/form-engine/{app,binder,captcha,modal-form,modals,page-form,render,submit}.js`:
`querySelector`/`querySelectorAll`/`closest`/`matches`, `classList.add|remove|toggle|contains`
і `className = '…'`. Для кожного записано `file:line`, операцію, селектор і
класи.

**B. Рендер обома темами.** У чистому Node викликано
`FormRender.render(config, { theme })` для трьох конфігів
(`add-property`, `notify`, `demo`) і витягнуто набори `id`, `data-*` і
`class`. Окремо викликано `theme.chrome(steps, copy)` — wizard-chrome не
входить у `FormRender.render`.

**Межі:**

- Початковий рендер не містить динамічних станів (`is-invalid`, `is-valid`,
  `active`) і DOM, який будує glue (file preview, опції dropdown). Тому ці
  місця перевірено читанням коду та CSS обох тем, а не рендером.
- Браузерний прогін glue (jsdom) у цьому item-і не виконувався: wire-тести
  `test/add-property-wire.test.mjs` покривають лише `bootstrap4`. Це
  прогалина тестів, а не коду — **JEK-E3**.
- Третє джерело — CSS тем (`themes/*.css`, `_sass/realtyua/_buttons.scss`) —
  використано, щоб відрізнити «клас реально стилізований» від «клас просто
  емітиться».

### Категорії

| Код | Значення | Хто володіє |
| --- | --- | --- |
| **A** | `data-*`-хук | контракт рушія, тема його лише емітить |
| **B** | класовий контракт | тема зобов'язана емітити, glue/CSS селектить |
| **C** | презентація теми | тема володіє; glue не повинен залежати |
| **D** | host-контракт | поза системою тем (Bootstrap-модалка) |
| **E** | стан, який ставить runtime | `is-invalid`/`is-valid`/`active` |

### Severity

| Рівень | Значення |
| --- | --- |
| **blocker** | селектор не знаходить елемент і ламає submit/валідацію |
| **risk** | працює, але випадково або деградує мовчки в одній темі |
| **cosmetic** | лише візуальний дрейф, поведінка ціла |
| **exempt** | свідомий контракт поза темами |

---

## 3. Інвентар селекторів

Рядки згруповано за файлом; однаковий клас в одному файлі перелічено з
усіма номерами рядків. Скорочення: `bs` = `themes/bootstrap4.js`,
`tw` = `themes/tailwind.js`, `b4c`/`twc` = відповідні `.css`.

### `binder.js`

| file:line | Селектор / клас | Операція | Кат. | bs | tw | Висновок |
| --- | --- | --- | --- | --- | --- | --- |
| `binder.js:140` | `.invalid-feedback` | `qsa` | B | так (`bs:141`) | так (`tw:51`) | ок |
| `binder.js:141` | `.valid-feedback` | `qsa` | B | так (`bs:132`) | так (`tw:50`) | ок |
| `binder.js:246-247` | `active` | `classList.add/remove` на `[data-toggle-for]` | E | так (native `.btn-group-toggle`) | так (`twc:325`) | ок |

### `modal-form.js`

| file:line | Селектор / клас | Операція | Кат. | bs | tw | Висновок |
| --- | --- | --- | --- | --- | --- | --- |
| `modal-form.js:61,65,107,118,120,128,132,134,147,222,229,231,233,234` | `d-none` | `classList.*` | D | host | host | exempt, G-7 |
| `modal-form.js:117,195,198` | `was-validated` | `classList.*` | D | host | host | exempt, G-7 |

### `modals.js`

| file:line | Селектор / клас | Операція | Кат. | bs | tw | Висновок |
| --- | --- | --- | --- | --- | --- | --- |
| `modals.js:68` | `.modal` | `classList.contains` | D | host | host | exempt, G-7 |
| `modals.js:71,77` | `hidden` | `classList.remove/add` | D | host | host | exempt, G-7 |

### `page-form.js`

| file:line | Селектор / клас | Операція | Кат. | bs | tw | Висновок |
| --- | --- | --- | --- | --- | --- | --- |
| `page-form.js:112` | `.step-indicator` | `el()` | B | так, chrome `bs:726` | так, chrome `tw:900` | крихко → **G-8** |
| `page-form.js:260` | `.is-invalid` | `querySelector` (перший невалідний контрол для scroll) | E | так (`b4c`) | так (`twc:49-127`) | крихко → **G-2** |
| `page-form.js:705,706,710,711` | `is-invalid`, `is-valid` | `classList.toggle` | E | так | так | крихко → **G-2** |
| `page-form.js:720,1178` | `.invalid-feedback` | `qsa` | B | так | так | ок |
| `page-form.js:733,1191` | `.valid-feedback` | `qsa` | B | так | так | ок |
| `page-form.js:739` | `.mt-2` | `closest` (панель location summary) | C→B | так (`bs:531`) | так (`tw:713`) | випадково → **G-3** |
| `page-form.js:791` | `.location-search-icon` | `querySelector` | B | так (`bs:502`) | так (`tw:684`) | ок |
| `page-form.js:802,1430` | `.position-relative` | `closest` (обгортка пошуку) | B | так (`bs:347,497`) | так (`tw:522,679`) | ок |
| `page-form.js:863` | `show` | `classList.toggle` | C | марка в markup | CSS немає | мертвий → **G-6** |
| `page-form.js:864,1473` | `.dropdown-item` | `qsa` | B | так | так | ок |
| `page-form.js:876` | `dropdown-item` (+ `searchable-dropdown-item`, `highlighted`) | `className=` | B + C | так, `highlighted` — site SCSS | так, `highlighted` — `twc:319` | → **G-5** |
| `page-form.js:886,890,898,1478` | `text-muted`, `text-muted small`, `dropdown-item text-muted` | `className=` | C | стилізовано Bootstrap | ні | → **G-5** |
| `page-form.js:947,1065` | `.custom-file`, `.custom-file-label` | `closest` + `querySelector` | B | так (`bs:388,393`) | так (`tw:574`, `tw:66`) | ок |
| `page-form.js:1071` | `.custom-file` | `closest` | B | так | так | ок |
| `page-form.js:1075,1076` | `is-invalid`, `is-valid` | `classList.toggle` | E | так | так | крихко → **G-2** |
| `page-form.js:1079` | `.file-previews` | `querySelector` | B | так (`bs:403`) | так (`tw:592`) | ок |
| `page-form.js:1088,1093,1095,1100,1129,1154,1198,1200,1203` | `file-preview`, `file-preview-row`, `file-preview-row-valid/invalid`, `file-thumb`, `file-badge-compress`, `file-list-info`, `file-list-info-row/label/value`, `file-preview-notice` | `className=` (будує glue) | B | так (`b4c:29-51`) | так (`twc:360-476`) | ок, нейтральні |
| `page-form.js:1107` | `img-fluid` | `className=` | C | так | ні | протікання → **G-4** |
| `page-form.js:1111` | `file-thumb-fallback d-flex align-items-center justify-content-center bg-light text-muted` | `className=` | B + C | змішано | лише `file-thumb-fallback` | → **G-4** |
| `page-form.js:1121` | `close position-absolute` | `className=` | B + C | `close` стилізовано, `position-absolute` — Bootstrap | `twc:418` додає `position:absolute` | → **G-4** |
| `page-form.js:1137,1143` | `.file-list-info-value`, `file-list-info-value-over` | `querySelector` + `classList.add` | B | так (`b4c:45,51`) | так (`twc:458,464`) | ок |
| `page-form.js:1465` | `.autocomplete-search-icon` | `querySelector` | B | так (`bs:351`) | так (`tw:526`) | ок |
| `page-form.js:1486` | `dropdown-item` + `highlighted` | `className=` | B | так | так (`twc:319`) | ок |
| `page-form.js:1497,1498` | `is-invalid`, `is-valid` | `classList.toggle` | E | так | так | крихко → **G-2** |
| `page-form.js:1699,1752` | `.captcha-widget` | `closest` | B | так (`bs:434`) | так (`tw:619`) | ок |
| `page-form.js:1701` | `.alert` | `qsa` | B | так (`bs:437-438`) | так (`tw:622-623`) | ок |
| `page-form.js:1753` | `.alert-info` | `querySelector` | B | так | так | ок |
| `page-form.js:1880,1884,1886,1887` | `.map-marker-info`, `.map-marker-info-loading`, `.map-marker-info-address`, `.map-marker-info-coords` | `querySelector`/`closest` | B | так (`bs:449-456`) | так (`tw:633-641`) | ок |
| `page-form.js:1885` | `.map-marker-info-address.text-muted.font-italic` | `querySelector` | B + C | так (`bs:455`) | **ні** (`tw:639` → `text-gray-500 italic`) | баг → **G-1** |

### `app.js`, `submit.js`, `captcha.js`

| file:line | Селектор | Кат. | Висновок |
| --- | --- | --- | --- |
| `app.js:15` | `script[type="application/json"][id$="-config"]` | A | не класовий, темою не керується |
| `submit.js:71` | `input[name], select[name], textarea[name]` | A | не класовий |
| `captcha.js:161` | `.cf-turnstile` | — | DOM третьої сторони (Turnstile), поза темами |
| `captcha.js:41,166,219,235,273,288` | `querySelector(selector)` | — | селектор передає виклик, не літерал |

Класових селекторів у `app.js`, `submit.js`, `captcha.js`, `render.js` немає.

---

## 4. Паритет `id` і `data-*`

Виміряно на реальному `FormRender.render` для трьох конфігів:

| Конфіг | `id` | `data-field` | `data-field-col` | `data-widget` | `data-widget-name` |
| --- | --- | --- | --- | --- | --- |
| `add-property` | 70 / 70, рівні | 38 / 38 | 38 / 38 | 4 / 4 | 4 / 4 |
| `notify` | 21 / 21, рівні | 10 / 10 | 5 / 5 | 0 / 0 | 0 / 0 |
| `demo` | 70 / 70, рівні | 38 / 38 | 38 / 38 | 4 / 4 | 4 / 4 |

`data-field-group` — атрибут без значення (`<div class="…" data-field-group>`),
тому він не потрапляє у вибірку `attr="…"`. Обидві теми його емітять:
`bs:359,397,515,658` і `tw:534,586,697,828`.

Висновок: **`data-*`-контракт повний і симетричний**. Усе, що сьогодні
крихке, — це класові селектори, а не `data-*`.

---

## 5. Матриця «hook × тема»

«Форма» = з'являється у `FormRender.render`; «chrome» = у `theme.chrome()`;
«glue» = будує runtime; «CSS» = лише стилізується темою.

| Hook | Кат. | bootstrap4 | tailwind | Джерело |
| --- | --- | --- | --- | --- |
| `invalid-feedback` | B | так | так | форма |
| `valid-feedback` | B | так | так | форма |
| `is-invalid` / `is-valid` | E | так | так | runtime + CSS |
| `active` | E | так | так | runtime + CSS |
| `custom-file` | B | так | так | форма |
| `custom-file-label` | B | так | так | форма |
| `file-previews` | B | так | так | форма |
| `file-preview*`, `file-thumb*`, `file-list-info*`, `file-badge-compress`, `file-preview-notice` | B | так | так | glue + CSS |
| `dropdown-menu` | B (CSS) | так | так | форма |
| `dropdown-item` | B | так | так | форма + glue |
| `highlighted` | B (visual) | так | так | glue + CSS |
| `position-relative` | B | так | так | форма |
| `location-search-icon` | B | так | так | форма |
| `autocomplete-search-icon` | B | так | так | форма |
| `captcha-widget` | B | так | так | форма |
| `alert`, `alert-info` | B | так | так | форма |
| `map-marker-info*` | B | так | так | форма |
| `step-indicator` | B | так | так | **chrome** |
| `mt-2` | B/C | так | так | форма (випадковий локатор) |
| `show` | C | марка в markup | ні | мертвий |
| `searchable-dropdown-item` | C | site SCSS | ні | glue |
| `text-muted` | C | так | ні | bootstrap-only |
| `font-italic` | C | так | ні | bootstrap-only |
| `img-fluid` | C | так | ні | bootstrap-only |
| `d-flex`, `align-items-center`, `justify-content-center`, `bg-light`, `position-absolute` | C | так | ні | bootstrap-only, glue DOM |
| `d-none`, `was-validated`, `modal`, `hidden` | D | host | host | модалка-notify |
| `.cf-turnstile` | — | vendor | vendor | Turnstile |

Окремо: `dropdown-menu`, `alert`, `custom-file` тощо **не** селектяться
glue — вони лише присутні в розмітці й стилізуються темами. Для них
класовий контракт потрібен тільки якщо його використовує CSS іншої теми.

---

## 6. Прогалини

### G-1 — Map fallback не ховається в Tailwind · **risk** · E2

**Факт.** Glue шукає запасний рядок адреси так:

```js
// page-form.js:1885
const fallback = shell.querySelector('.map-marker-info-address.text-muted.font-italic');
```

`bootstrap4` емітить рівно цей набір (`themes/bootstrap4.js:455`), а
`tailwind` — `.map-marker-info-address.text-gray-500.italic`
(`themes/tailwind.js:639`). У Tailwind `fallback` дорівнює `null`, тому
`fallback.hidden = …` (`page-form.js:1892`) ніколи не виконується.

**Наслідок.** Користувач Tailwind-сторінки бачить «Адресу не вдалося
визначити» навіть тоді, коли адреса успішно визначена — над рядком
«Адреса: …». Це єдиний знайдений дефект, який видно в UI.

**Рекомендація.** Додати `data-map-fallback` на запасний `<div>` в обох
темах і селектити `[data-map-fallback]`. Класи лишити як презентацію.

```html
<!-- themes/bootstrap4.js:455 -->
<div class="map-marker-info-address text-muted font-italic" data-map-fallback>…</div>
<!-- themes/tailwind.js:639 -->
<div class="map-marker-info-address text-gray-500 italic" data-map-fallback>…</div>
```

```js
// page-form.js:1885
const fallback = shell.querySelector('[data-map-fallback]');
```

**Тест (E3):** jsdom-прогін Tailwind-сторінки з адресою → `fallback.hidden === true`.

---

### G-2 — `bindForm({ classes })` існує, але ним не користуються · **risk** · E2

**Факт.** `binder.js:79-82` описує `opts.classes`, `binder.js:92-93` тримає
Bootstrap-дефолти `is-invalid`/`is-valid`, але обидва glue-и передають лише
`colClass`:

```js
// page-form.js:78, modal-form.js:43
const binder = bindForm(form, controller, { colClass: theme.colClass });
```

Додатково glue сам, повз binder, перемикає `is-invalid`/`is-valid`
(`page-form.js:260,705-711,1075-1076,1497-1498`).

**Наслідок.** Зараз усе працює, бо **обидві** теми стилізують саме
Bootstrap-імена (`bootstrap4.css:18-182`, `tailwind.css:48-127,228-258`).
Але «theme-neutral» це лише за назвою: Tailwind-тема змушена тримати
Bootstrap-словник станів, а параметр `classes` — мертвий код. Будь-яка
третя тема не зможе задати свої стани, не патчучи glue.

**Рекомендація (E2).** Зробити стан валідності частиною інтерфейсу теми:

```js
// обидві теми, поки поведінка не змінюється
validationClasses: { invalid: 'is-invalid', valid: 'is-valid' },
```

- `bindForm(..., { classes: theme.validationClasses, colClass: theme.colClass })`
  у `page-form.js` і `modal-form.js`;
- усі `classList.toggle('is-invalid', …)` у glue замінити на
  `theme.validationClasses.invalid`;
- `form.querySelector('.is-invalid')` (`page-form.js:260`) — на
  `form.querySelector('.' + theme.validationClasses.invalid)`.

Це не змінює рендер і не ламає тести, але прибирає прихований Bootstrap-контракт.

---

### G-3 — Панель location summary шукається через `.mt-2` · **risk** · E2

**Факт.**

```js
// page-form.js:739
const panel = form.querySelector('[data-location-summary]')
  ? form.querySelector('[data-location-summary]').parentElement.closest('.mt-2')
  : null;
```

Обидві теми випадково ставлять `mt-2` на обгортку
(`themes/bootstrap4.js:531`, `themes/tailwind.js:713`). `mt-2` — spacing-
утиліта, а не контракт: зміна відступу в темі тихо вимкне показ/приховування
панелі.

**Рекомендація (E2).** `data-location-summary-panel` на обгортці; glue
селектить його напряму:

```js
const panel = form.querySelector('[data-location-summary-panel]');
```

Клас `mt-2` лишається лише для відступу.

---

### G-4 — Glue будує file-preview з Bootstrap-утилітами · **cosmetic** · E2

**Факт.** `page-form.js` створює DOM із `img-fluid`
(`:1107`), `file-thumb-fallback d-flex align-items-center justify-content-center bg-light text-muted`
(`:1111`) і `close position-absolute` (`:1121`).

**Наслідок.** Tailwind не має цих утиліт; візуально рятують правила
`.file-thumb img` (`twc:390`), `.file-thumb-fallback` (`twc:395`) і
`.file-thumb .close` (`twc:418`). Поведінка ціла, але розмітка, яку генерує
рушій, не є theme-neutral. У Bootstrap4 `.file-thumb .close` покладається на
`position-absolute` з markup (`b4c:40` не задає `position`).

**Рекомендація (E2).** Лишити в glue тільки нейтральні хуки
(`file-thumb`, `file-thumb-fallback`, `file-thumb-img`, `file-remove`), а
решту перенести в CSS тем:

- `img-fluid` → прибрати (`.file-thumb img` уже є в обох CSS);
- `d-flex align-items-center justify-content-center bg-light text-muted` →
  прибрати; доповнити `b4c .file-thumb-fallback` фоном і кольором, як у
  `twc:395-400`;
- `close position-absolute` → `file-remove`; додати `position: absolute` у
  `b4c .file-remove` (у `twc:418-430` воно вже є).

---

### G-5 — Опції dropdown змішують нейтральні й Bootstrap-класи · **cosmetic** · E2

**Факт.** Glue будує опції з `dropdown-item` + `searchable-dropdown-item`
+ `highlighted`, а всередині — `text-muted`, `text-muted small`
(`page-form.js:876-898,1478,1486`).

- `dropdown-item` і `highlighted` стилізовані обома темами
  (`twc:307-323`; Bootstrap — `_sass/realtyua/_buttons.scss:32-33`).
- `searchable-dropdown-item` існує **лише** в site-SCSS
  (`_sass/realtyua/_buttons.scss:11-27`) — Tailwind-гілка його не стилізує,
  тому довгі варіанти можуть не переноситися.
- `text-muted` — Bootstrap-ім'я; Tailwind не має такої утиліти, тому
  другорядний текст у Tailwind може мати не той колір.

**Рекомендація (E2).** Замінити Bootstrap-імена на семантичні хуки й
додати їх у CSS обох тем:

```text
dropdown-item           (лишається)
dropdown-item-info      (колишній <small class="text-muted">)
dropdown-item-tail      (колишній <div class="text-muted small">)
dropdown-item-empty     (колишній dropdown-item text-muted)
```

`searchable-dropdown-item` або перенести в `tailwind.css`, або замінити на
`dropdown-item-wrap`. Мінімальний варіант — додати в `tailwind.css` правила
для `.searchable-dropdown-item` і `.dropdown-item small`.

---

### G-6 — `.show` перемикається, але нічого не робить · **cosmetic** · E2

**Факт.** `page-form.js:863` робить `dropdown.classList.toggle('show', …)`,
хоча видимість уже задає inline `style.display` (`:862`). У Tailwind немає
CSS для `.show`; у Bootstrap `.dropdown-menu.show` — стандартний спосіб
показати меню, але тут він дублює inline-стиль.

**Рекомендація (E2).** Прибрати `classList.toggle('show', …)` і `show` з
markup обох тем; єдине джерело видимості — `style.display`. Або, якщо
хочуть декларативність, замінити на `data-open` і стилізувати його в обох
темах. Тестів, які перевіряють `.show`, немає.

---

### G-7 — Модальний glue спирається на Bootstrap-host · **exempt** · поза E2

**Факт.** `modal-form.js` перемикає `d-none` і `was-validated`;
`modals.js` перевіряє `.modal` і перемикає `.hidden`. Це контракт
Bootstrap-модалки (`_includes/modals/notify-property.html`), а не теми
форми.

**Рішення.** Не змінювати в E2. Зафіксувати в `theming.md` як **host
contract**: `behavior.mode: modal` наразі підтримується лише на
Bootstrap-хості. Якщо знадобиться Tailwind-модалка — окремий item (EL-*),
а не розширення E2.

---

### G-8 — `.step-indicator` селектиться за класом · **risk (низький)** · E2

**Факт.** `page-form.js:112` → `el('.step-indicator')`; клас емітують обидва
chromes (`bs:726`, `tw:900`). Glue використовує його для `hidden`
(`:142`) і `scrollIntoView` (`:287`).

**Наслідок.** Якщо тема перейменує клас, індикатор не ховатиметься після
submit і не скролитиметься — тихо.

**Рекомендація (E2).** `data-step-indicator` на обгортці chrome; glue
`el('[data-step-indicator]')`. Клас лишається для стилю.

---

## 7. Що вже theme-neutral (не чіпати в E2)

- **`data-*`-контракт:** `data-field`, `data-field-col`, `data-field-group`,
  `data-widget`, `data-widget-name`, `data-error`, `data-required-marker`,
  `data-clear`, `data-depends`, `data-toggle-for`, `data-location-*`,
  `data-autocomplete-*`, `data-captcha-*`, `data-map-*`,
  `data-price-info`, `data-step-nav`, `data-step-title`, `data-step-prev`,
  `data-step-next`, `data-step-actions`, `data-step-spacer`, `data-submit*`,
  `data-submitted-block`, `data-error-block`, `data-error-text`,
  `data-error-code`, `data-location-summary`, `data-location-dropdown`.
- **Нейтральні класові хуки, які обидві теми емітять і обидві CSS
  стилізують:** `custom-file`, `custom-file-label`, `file-previews`,
  `file-preview*`, `file-thumb*`, `file-list-info*`, `file-badge-compress`,
  `file-preview-notice`, `dropdown-item`, `highlighted`, `position-relative`,
  `location-search-icon`, `autocomplete-search-icon`, `captcha-widget`,
  `alert`, `alert-info`, `map-marker-info*`, `invalid-feedback`,
  `valid-feedback`.
- **Стан:** `is-invalid`/`is-valid`/`active` — спільні для обох тем; E2 лише
  формалізує їх через `theme.validationClasses`.
- **Інтерфейс теми** ідентичний в обох темах:
  `addon, chrome, colClass, controlAttrs, feedbackHtml, field, form,
  helperHtml, labelHtml, modals, name, navTokens, requiredMarker`.
  `chrome()` повертає `{ top, bottom }`; `navTokens` — списки класів, які
  glue навішує на `[data-step-nav]` (тому chip-стани не є класовим
  контрактом: їх задає тема через island `chrome.nav`).

---

## 8. Рішення для JEK-E2

Порядок — від ризику до косметики; усе разом дає один логічний коміт.

| # | Прогалина | Зміна | Файли |
| --- | --- | --- | --- |
| 1 | G-1 | `data-map-fallback` + селектор | `themes/bootstrap4.js`, `themes/tailwind.js`, `page-form.js` |
| 2 | G-2 | `theme.validationClasses` + передати в `bindForm`; прибрати літерали з glue | `themes/*.js`, `page-form.js`, `modal-form.js`, `binder.test.mjs` |
| 3 | G-3 | `data-location-summary-panel` | `themes/*.js`, `page-form.js` |
| 4 | G-8 | `data-step-indicator` | `themes/*.js`, `page-form.js` |
| 5 | G-4 | нейтральні хуки file-preview; прибрати утиліти з glue | `page-form.js`, `themes/*.css` |
| 6 | G-5 | `dropdown-item-info/tail/empty`; Tailwind CSS для `searchable-dropdown-item` | `page-form.js`, `themes/*.css` |
| 7 | G-6 | прибрати `show` | `page-form.js`, `themes/*.js` |

**Не входить у E2:** G-7 (host contract), будь-які `_data/**`,
`_includes/form/app/**`, baseline.

**Очікуваний ефект:** `FormRender.render` для `bootstrap4` не змінюється
(крім нових `data-*`-атрибутів); Tailwind-рендер отримує ті самі
`data-*`; жоден наявний id/`data-*`-хук не перейменовується. Гейт
`render-tailwind` має лишитися зеленим, а `VR`/`B` — без нових
розбіжностей (їх усе одно перевірятиме E2, не E1).

---

## 9. Для JEK-E3 (Bootstrap4 render-тести до паритету)

- Додати **Tailwind wire-тест** (jsdom) для `add-property`: сьогодні
  `test/add-property-wire.test.mjs` жене лише `bootstrap4`, тому G-1 і
  G-4/G-5 невидимі для тестів.
- Замінити перевірку «hook-токен присутній у HTML» на контракт
  «кожен селектор glue знаходить елемент» — побудувати таблицю
  селектор → елемент і прогнати її для обох тем.
- Перевіряти `chrome()`, а не лише `FormRender.render`: `step-indicator`
  і `data-step-*` живуть у chrome.
- Узгодити `BOOTSTRAP_TOKENS` (`test/render-tailwind.test.mjs:27-39`) із
  `HOOK_TOKENS` (`:43-47`): `alert-info` є в обох списках у різних
  контекстах; для widget-рендерів (captcha) потрібен окремий allow-list,
  інакше тест або хибно зелений, або хибно червоний.
- Додати регресію на G-1: адреса є → fallback прихований; адреси немає →
  fallback видимий.

---

## 10. Для JEK-E4 (доступність)

Аудит не виявив класових хуків, які блокують доступність, але фіксує місця,
де E4 має перевірити поведінку:

- `step-indicator`/`data-step-nav` — `aria-current` для поточного кроку;
- `invalid-feedback`/`valid-feedback` — `aria-live`/`aria-describedby` і
  зв'язок із контролом (зараз `data-error` + `aria-describedby` уже є);
- `dropdown-item` — роль/клавіатура списку результатів;
- `file-remove` (після G-4) — доступна назва кнопки видалення;
- map fallback — статус геокодування має озвучуватися, а не лише ховатися.

---

## 11. Для JEK-E5 (docs)

- `_form-engine/README.md:259` — перевести 7c з `pending` у `done` з
  посиланням на цей аудит (crash закрито в 7a/7b).
- `.opencode/skills/form-engine/references/theming.md` — оновити список
  glue hooks: додати `position-relative`, `step-indicator` (до E2),
  `is-invalid`/`is-valid`, `file-preview*`, `map-marker-info*`,
  `captcha-widget`, `location-search-icon`, `autocomplete-search-icon`;
  після E2 — `data-map-fallback`, `data-location-summary-panel`,
  `data-step-indicator`, `theme.validationClasses`.
- `docs/form-engine/theme-neutral-hooks.md` — лишити як історичний аудит;
  після E2 додати в кінець короткий «post-E2» блок зі статусом кожної
  прогалини.

---

## 12. Що перевірено і що ні

**Перевірено:**

- усі класові селектори у 8 runtime-файлах (статичний інвентар);
- `id`/`data-*`-паритет на трьох конфігах у двох темах;
- наявність кожного hook-класу в markup і CSS обох тем;
- існування `.form-group`-селекторів у runtime (немає);
- інтерфейс тем і `navTokens`/`chrome()`.

**Не перевірено (свідомо поза E1):**

- живий браузерний прогін glue для Tailwind (потрібен E3);
- повний Bootstrap4 render-паритет (E3);
- доступність (E4);
- повний Jekyll build (E5);
- 11ty-двійник `reifua` (EL-*).

**Гейти E1 (без зміни коду):** `T` 214/214, `V` 3/3, `CA` PASS.
`VR`/`B`/`P` не запускалися — runtime, теми, конфіги й baseline не змінені.
