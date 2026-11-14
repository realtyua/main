# JEK-R9 — Property notify: підключити `form-engine/app.js`

Phase: 3 · Depends: BASE-5 · Repo: realtyua
Branch: `feat/JEK-R9-property-notify-appjs` · Worktree: `../worktrees/JEK-R9-property-notify-appjs`

Status: `done`

## Goal

На property-сторінках модалка «Написати власнику» має реально запускатися:
`form-engine/app.js` підключений рівно один раз, тож JSON-острівці
`#notify-config`/`#notify-page` рендеряться у форму, а `check-notify` зелений.

## Контекст дефекту

- `_layouts/property.html:238` включає `_includes/modals/notify-property.html`.
- Модалка містить `#notify-app`, `#notify-config`, `#notify-page`, але **не**
  підключає `assets/js/form-engine/app.js` — єдиний browser entry, який
  знаходить острівці й монтує форму.
- Тому на property-сторінці модалка порожня, а `check-notify.mjs` падає:
  `missing the form-engine/app.js module include`.
- Єдине місце, де модуль підключений для notify, — сирітський generated
  `_includes/form/app/notify.html`; його ніхто не include-ить (JEK-R5).

## Files

- `_includes/modals/notify-property.html` — додати один
  `<script type="module" src=".../form-engine/app.js?v=...">` після
  `#notify-page`.
- `_form-engine/tools/check-notify.mjs` — **не змінювати**: перевірка вже є.
- `_form-engine/baseline/**` — **не чіпати**.

## Steps

1. Worktree `../worktrees/JEK-R9-property-notify-appjs`, гілка
   `feat/JEK-R9-property-notify-appjs`; junction `node_modules`.
2. Baseline-гейти: `npm test` (після першого build — 214/214),
   три `validate-config --strict`, `verify-render.mjs verify`,
   `check-notify` (зафіксувати поточний failure).
3. Додати в `_includes/modals/notify-property.html` рівно один module-script:
   `{{ '/assets/js/form-engine/app.js' | relative_url }}?v={{ site.time | date: '%Y%m%d%H%M%S' }}`.
   Токен `site.time` (цифри) — як у `_includes/java-script.html`;
   `verify-render` нормалізує його до `?v=BUILD`, тож diff буде лише від
   нового тегу.
4. Offline-build, далі `check-notify` і `verify-render.mjs verify`.
5. Перевірити `_site`: на property-сторінці рівно один module-include
   `form-engine/app.js`, `#notifyModal` присутній, legacy `notify.js` — 0.
6. Ручний smoke (користувач): `jekyll serve --limit_posts 1`, відкрити
   property-сторінку, натиснути «Написати власнику» — форма рендериться.
7. Handoff + рядок у `WORKITEMS.md`.

## Acceptance

- На property-сторінці рівно один
  `<script type="module" ... form-engine/app.js ...>`.
- `node _form-engine/tools/check-notify.mjs` → `ok (1 page(s) checked)`.
- `verify-render.mjs verify`: property-фрагмент відрізняється від baseline лише
  доданим `<script>`; інших змін немає. Baseline не перезаписувати.
- `npm test` — 214/214; 3/3 конфіги valid.
- Модалка відкривається і рендерить форму (ручний smoke).
- Legacy `/assets/js/notify.js` не підключений.

## Gates

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-notify.mjs
node _form-engine/tools/verify-render.mjs verify
powershell -File _form-engine/tools/verify-render.ps1 verify
```

Build — офлайн (`--limit_posts 1`, тимчасовий `jekyll_get_json: []` поза репо).

## Out of scope

- Дубль `_includes/form/notify-property.html`, сирота
  `_includes/form/app/notify.html`, застарілий коментар у модалці — JEK-R5.
- Перехід cache-токена з `site.time` на engine digest — окреме рішення.
- Перегенерація baseline — заборонена без свідомого рішення.
- `url`/`property_url` — JEK-R2 (уже зроблено).
- EOL-нормалізація — JEK-R8.
- `reifua` (11ty) — EL-4/EL-7.

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-04: Початок сесії. Worktree
  `../worktrees/JEK-R9-property-notify-appjs`, гілка
  `feat/JEK-R9-property-notify-appjs` (worktree створено в detached HEAD,
  одразу перейшли на гілку), junction `node_modules` на канонічний
  `main/node_modules`.
- 2026-11-04: Baseline до правок. У свіжому worktree `npm test` спершу падав
  на CRLF-vs-LF у `test/form-app-fresh.test.mjs` (`core.autocrlf=true`);
  після першого offline-build — **214/214**. Конфіги — **3/3 valid**
  (`add-property`, `notify`, `demo`, `--strict`).
- 2026-11-04: Baseline `check-notify` — **1 failure**:
  `district/town/kosiv/apartment/prodam-1789988154.html: missing the
  form-engine/app.js module include`. `verify-render.mjs verify` — 2/3
  changed: `new.html` (freshness `sha=`) і `assets/data/form-config.json`
  (copy-drift, JEK-R3); property-фрагмент **ok** (baseline = без скрипта).
- 2026-11-04: Правка — рівно один рядок у
  `_includes/modals/notify-property.html` після `#notify-page`:
  `<script type="module" src="{{ '/assets/js/form-engine/app.js' | relative_url }}?v={{ site.time | date: '%Y%m%d%H%M%S' }}"></script>`.
  Інші файли не змінювалися; `check-notify.mjs` і baseline не чіпано.
- 2026-11-04: Build офлайн (`--limit_posts 1`, тимчасовий override
  `jekyll_get_json: []` поза репо). `_site` property-сторінка: `#notifyModal`
  — 1, module-скрипт `form-engine/app.js` — 1, legacy
  `/assets/js/notify.js` — 0.
- 2026-11-04: Гейти після правки: `check-notify` — **ok (1 page(s) checked)**;
  `npm test` — **214/214**; 3/3 конфіги valid. `verify-render.mjs verify`:
  property-фрагмент CHANGED лише доданим `<script type="module" ...>` (після
  нормалізації `?v=BUILD`), інших змін у фрагменті немає. `new.html` і
  `form-config.json` лишилися на тих самих pre-existing розбіжностях
  (`sha=` freshness + copy-drift JEK-R3), що й до правки.
- 2026-11-04: Generated `_includes/form/app/add-property.html` після build
  змінено лише в `sha=`/`?v=`; відкочено до `HEAD`, у diff не входить.
  Baseline не перезаписувався.
- 2026-11-04: Лишилося ручному smoke (користувач): `jekyll serve
  --limit_posts 1`, property-сторінка → «Написати власнику» → форма рендериться.
- 2026-11-04: Commit SHA: немає (агент не комітить; staging/commit/merge —
  користувач).
- 2026-11-05: Закрито. Item-коміт `c4ce9c75` (`JEK-R9: load form-engine app.js
  in property notify modal`), spec — `71f2b5ca`; merge у
  `feature/form-engine`: `e83c1c1f` (`--no-ff`). Worktree прибрано; статус
  у реєстрі — `done`.
