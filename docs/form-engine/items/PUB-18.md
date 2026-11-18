# PUB-18 — Mouse pick in autocomplete and location dropdowns

Phase: 6 · Depends: PUB-13 · Repo: form-engine (source), realtyua (local verification)

Branch: `feat/PUB-18-autocomplete-mouse-pick` (merged) · Worktree: `C:\Users\Vasyl\Documents\GitHub\worktrees\PUB-18-autocomplete-mouse-pick` (cleaned 2026-11-18)

Status: `done`

## Problem

Користувач вводить запит у `type: autocomplete` (`type_address`) або у пошук
`widget: location` (`location_widget.settlement`). Записи з'являються, наведення
мишею їх підсвічує, але лівий клік не обирає запис. Клавіатура (стрілки + Enter)
працює коректно.

## Root cause

У `runtime/page-form.js` обидва `mouseenter`-обробники (`renderLocationDropdown`
і `syncAcSearch`) викликали повний ре-рендер dropdown-у: видаляли всі
`.dropdown-item` і створювали нові `<button>`. Chromium після заміни вузла під
курсором знову викликає `mouseenter` на новому вузлі → ре-рендер повторюється
безкінечно. Вузол постійно від'єднується, тому `mousedown`/`click` не доходить
до обробника вибору. Клавіатурний шлях не викликає ре-рендер на hover, тому й
працює.

Відтворено локально в Chromium: за ~1 с 14 подій `mouseenter`, 0 спрацьованих
`pick`; після заміни на in-place підсвічування — 1 `mouseenter` і клік обирає
значення.

## Fix

- `runtime/page-form.js`: додати `highlightDropdownItem(dropdown, index, input)`,
  який оновлює `highlighted`, `aria-selected` та `aria-activedescendant` на
  наявних кнопках, не перебудовуючи DOM.
- Обидва `mouseenter`-обробники тепер лише змінюють `st.highlightIndex` і
  викликають цей helper.
- Regression-тести:
  - `test/form-page.test.mjs` — autocomplete: hover не замінює вузол, клік
    зберігає значення.
  - `adapters/jekyll/test/add-property-wire.test.mjs` — location: те саме.
- `CHANGELOG.md` — запис у `[Unreleased]`.

## Baseline gates (before changes, form-engine master abccf5b)

- `npm test` — 185/185
- `npm run test:jekyll` — 37/37
- `npm run test:eleventy` — 23/23

## Item gates

- `npm test` — 186/186 (+1 regression test)
- `npm run test:jekyll` — 38/38 (+1 regression test)
- `npm run test:eleventy` — 23/23

## Local propagation (виконано 2026-11-18)

- Скопійовано виправлений `runtime/page-form.js` у
  `realtyua/main/node_modules/@realtyua/form-engine/runtime/`.
- Виконано `npm run sync:form-engine` у `realtyua/main` — матеріалізація у
  `assets/js/form-engine/`, `_form-engine/tools/`, `_form-engine/schema/`.
- `_includes/form/app/add-property.html` перепечено: оновлено `form-bake sha`
  та `?v=` (`ac3e5f573ec1` → `a9cb0509cac8`).
- Site gates: `npm test` 228/228, `npm run validate` — valid.
- Без `npm install` і без мережі.

## Out of scope

- Реліз нової версії пакета та `npm install` на сайтах (мережа заборонена).
- Міграція `reifua` (PUB-14).
- Зміни конфігів/тем/адаптерів.

## Handoff log

### 2026-11-18 — implementation

Діагноз підтверджено в Chromium; виправлення й regression-тести реалізовано у
worktree. Гейти зелені. Локальну матеріалізацію на сайт виконано окремим кроком
після огляду. Коміт/мердж — лише після явного «прийнято».

### 2026-11-18 — review/merge

Огляд прийнято. Item-коміт `ca98184` змерджено в `master` form-engine через
`git merge --no-ff` (merge-коміт `4e62dc8`). Локальне поширення на сайт і
перегенерація baked-фрагмента виконано; site gates 228/228. Гілку item-а й
worktree прибрано. Push — користувач.
