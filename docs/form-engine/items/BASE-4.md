# BASE-4 — Гілка + логічні коміти reifua

Phase: 2 · Depends: BASE-3 · Repo: reifua
Branch: `feature/form-engine` · Worktree: —

Status: `review` (гейти зелені, чекає комітів користувача)

## Goal

`reifua` має гілку `feature/form-engine` з тим самим рушієм, що й `realtyua`,
розбитим на логічні коміти. `master` лишається недоторканим (b27fe4d).

## Deploy-профіль (перевірено)

| | |
| --- | --- |
| Default branch | `master` |
| CI | `.github/workflows/main.yml`, тригер `push: branches: [master]` |
| Build | `npm ci && npm run build` → `dist` → GitHub Pages |
| Netlify | `netlify.toml` присутній (`publish = dist`, `command = npm run build`) — production-гілка не вказана, деплой-прев'ю лише для PR |
| `origin/main` | існує (3a18a0a), не default |
| `origin/gh-pages` | існує (1ab5822), застаріла |

Висновок: коміти й push у `feature/form-engine` **не деплояться** ні через
GitHub Pages (фільтр гілки), ні через Netlify (production — окрема гілка).

## Files (85 змін: 5 M + 80 ??)

### Група 1 — рушій, адаптер, vendor (38)

- `lib/form-engine.js`
- `src/assets/js/form-engine/**` (23, разом з `themes/` і `package.json`)
- `_form-engine/schema/form-config.schema.json`
- `_form-engine/tools/validate-config.mjs`, `_form-engine/tools/yaml.mjs`
- `src/_data/add-property.yml`, `src/_data/demo.yml`, `src/_data/notify.yml`
- `src/new.njk`
- `src/assets/vendor/leaflet.css`, `src/assets/vendor/leaflet.js`
- `src/assets/css/images/*.png` (5: marker-icon, marker-icon-2x, marker-shadow,
  layers, layers-2x)

### Група 2 — тести (15)

- `test/*.test.mjs` (add-property-parity, add-property-wire, binder, conditions,
  config, controller, form-page, html, layout, model, notify-config,
  notify-parity, render-tailwind, render, validation)

### Група 3 — конфіг Eleventy і залежності (5)

- `.eleventy.js` — passthrough `data/`, `css/images/`, `js/form-engine/`;
  підключення `./lib/form-engine`
- `tailwind.config.js` — form-тема в `purge.content`; палітра перенесена в
  `extend`; `amber`/`cyan`; `margin`-фракції
- `package.json` — скрипти `test`/`validate`, `linkedom`, `js-yaml`
- `package-lock.json`
- `src/_data/menu.json` — пункти «Головна» і «Додати оголошення» (`/new`)

### Група 4 — НЕ рушій: дані регіонів (27, ~7.9 MB) — рішення окремо

- `src/assets/data/*.json` (24), `src/assets/data/info`,
  `src/assets/data/scraper.py`

`realtyua` тримає аналогічні 28 файлів у `assets/data` (трековані). У `reifua`
вони досі не трековані. Це дані сайту, не Form Engine.

Рекомендація: **не включати в BASE-4**. Окремий item (або `EL-5`, passthrough
`data/`), де свідомо вирішується: трекати чи ні, і чи потрапляє `scraper.py`
в репозиторій.

## Steps

1. ✅ Перевірити deploy-профіль `reifua`.
2. ✅ `git checkout -b feature/form-engine` (від `master` b27fe4d).
3. ✅ Інвентаризація 85 файлів → 4 групи.
4. Коміти робить користувач (агент не виконує `git add`/`git commit`).

## Acceptance

- 58 файлів розкладені на 3 коміти, робоче дерево містить лише групу 4.
- `master` = b27fe4d, не зрушив.
- Нічого не запушено.

## Gates

```powershell
cd ..\..\reifua\main
npm test        # очікується 208+
npm run validate
```

## Out of scope

- Push у `origin` (BASE-5, потребує мережі й окремого дозволу).
- Дані регіонів (група 4).
- Повна синхронізація `_form-engine/` з realtyua (15 файлів проти 3) — це `EL-1`.
- Сторінки add-property/notify у 11ty — `EL-2`/`EL-4`.

## Handoff log

- 2026-11-01: гілку створено, інвентаризацію виконано. Deploy перевірено:
  GitHub Pages слухає лише `master`. Знайдено, що 27 файлів у
  `src/assets/data/` — не рушій, а дані сайту (~7.9 MB), винесено з scope
  в окремий item `BASE-6` (рішення: лишити untracked до нього).
- 2026-11-01: `npm test` у reifua — 208/208 pass. Готово до комітів
  (3 групи, 58 файлів).
