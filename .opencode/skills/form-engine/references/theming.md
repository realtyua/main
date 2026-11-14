# Теми

Тема — це **markup (JS) + skin (CSS)**:

```text
assets/js/form-engine/themes/
├── bootstrap4.js     # повний рендерер полів, chrome, модалок
├── bootstrap4.css    # скін, інлайниться у фрагмент
├── tailwind.js
├── tailwind.css
└── themeStyle.js     # читає <theme>.css під час bake
```

Вибір: `config.theme: bootstrap4 | tailwind`. За замовчуванням Jekyll-адаптер дає
`bootstrap4`, 11ty-адаптер — `tailwind` (`config.theme || 'tailwind'`).

## Що мусить збігатися між темами

`FormRender.render` (render.js) вибирає тему з `THEMES` і передає їй спільний
`ctx`. Обидві теми експортують однаковий інтерфейс:

```js
{ name, form, field, labelHtml, requiredMarker, helperHtml, feedbackHtml,
  controlAttrs, addon, colClass, chrome, modals, navTokens }
```

Інваріанти:

- ті самі `id`, `name`, `data-*` hooks, кроки, `data-depends`;
- **жодних Alpine-атрибутів** (`x-*`, `@*`, `:*`) — це перевіряють тести й
  `check-add-property`;
- `colClass` перекладає сітку: Bootstrap-токени конфігу (`col-12 col-md-6`,
  `offset-md-3`) → Tailwind (`w-full md:w-1/2`, `md:ml-1/4`);
- спільні spacing-утиліти проходять як є.

## Glue hooks

Page/modal glue селектить класи за іменами, тому вони мусять лишатися в обох
темах поруч із утилітами:

```text
custom-file  custom-file-label  dropdown-menu  dropdown-item
alert  alert-info  file-previews  mt-2
```

Саме тому Tailwind-тема не є «чистою» — інакше той самий controller/binder/glue
не працював би без змін.

`bindForm` приймає `opts.classes`:

```js
bindForm(root, controller, { invalid: 'border-red-500', valid: 'border-green-500' })
```

Дефолт — `is-invalid` / `is-valid` (Bootstrap).

## Tailwind

- `themes/tailwind.js` експортує `SAFELIST`; він синхронний з `FRACTIONS`
  (ширини колонок) і розмірами модалок.
- Purge має сканувати тему, інакше утиліти зникнуть. Перевіряти
  `tailwind.config.js` (`content`).
- Зміна сітки або модалки = оновлення SAFELIST + render-тест.

## Тестування теми

- `test/render-tailwind.test.mjs` — повний паритет hooks з Bootstrap:
  кожен id і `data-*` присутній, glue hooks збережені, bootstrap-утиліт немає.
- Bootstrap4 render-тести до повного паритету — JEK-E3 (ще не завершено).
- Theme-neutral DOM hooks — Phase 7c, **pending** (JEK-E1/E2).

## Додавання віджета

1. Додай тип у словник рендерера (`FIELD_TYPES` / `WIDGET_TYPES`).
2. Реалізуй у **обох** темах; markup копіюй зі старого partial-а мінус Alpine.
3. Збережи `data-widget` hooks і id-контракт.
4. Додай кейс у render-тести обох тем.
5. Якщо потрібен новий клас для glue — додай його в обидві теми.

## Чого не робити

- не редагувати `<theme>.css` як «скіновий хак» для структурної проблеми;
- не додавати theme-specific селектор у glue;
- не змінювати `theme` у `_data/*.yml`, щоб «пройшов тест»;
- не покладатися на те, що Tailwind-тема стане дефолтною на Jekyll.
