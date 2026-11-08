# JEK-E5 — Повний build + docs

Phase: 4 · Depends: JEK-E4 · Repo: realtyua
Branch: `feat/JEK-E5-full-build-docs` · Worktree: `../worktrees/JEK-E5-full-build-docs`

Status: `todo`

## Goal

Виконати повний Jekyll build (`jekyll build` без `--limit_posts`), оновити документацію рушія (`_form-engine/README.md`, `theming.md`), перезахопити baseline для `verify-render` і пройти **усі** гейти (T, V, CA, CN, VR). Це завершує Phase 4 — Jekyll engine готовий до паритету з 11ty.

## Files

Створюються/оновлюються:

- `_form-engine/README.md` — актуальний статус, архітектура, конвеєр, гейти (після JEK-R6 оновлювався частиково, треба синхронізувати з E1..E4).
- `docs/form-engine/theming.md` — актуальний опис тем, hook-контракт, CSS-tokens, як додати тему (синхронізувати з JEK-E1/E2/E3).
- `_includes/form/app/add-property.html` — **regenerated** через `_form-engine/tools/gen-form-app.mjs` (маркер `form-bake` і sha оновляться).
- `_form-engine/baseline/**` — перезахоплені знімки для `verify-render` (після ручного перегляду diff).

Читаються, але **не змінюються** (крім regen baked):

- `_data/add-property.yml`, `_data/notify.yml`, `_data/demo.yml`;
- `_form-engine/schema/**`, `_form-engine/tools/**`, `_plugins/**`;
- `assets/js/form-engine/**` (runtime, теми, binder, controller);
- `test/**`.

## Steps

1. Worktree `JEK-E5-full-build-docs`, гілка `feat/JEK-E5-full-build-docs` (detached HEAD → `git checkout -b`).
2. Junction `node_modules` на `../../main/node_modules` (без `npm install`).
3. Baseline-гейти **до** будь-яких правок:
   - `npm test` (214/214 очікувано, але JEK-E4 додав тести → 228/228)
   - `node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict`
   - `node _form-engine/tools/validate-config.mjs _data/notify.yml --strict`
   - `node _form-engine/tools/validate-config.mjs _data/demo.yml --strict`
   - `node _form-engine/tools/check-add-property.mjs`
   - `node _form-engine/tools/check-notify.mjs`
4. Оновити `_form-engine/README.md`:
   - Додати/синхронізувати: theme-neutral hooks (JEK-E1/E2), Bootstrap4 parity (JEK-E3), accessibility (JEK-E4).
   - Поточний статус гейтів, відомі failures, baseline дата.
   - Архітектура: binder, page-form, controller, themes, hooks.
5. Оновити `docs/form-engine/theming.md`:
   - Hook-контракт (JEK-E2), CSS-tokens (`BOOTSTRAP_TOKENS`, `HOOK_TOKENS`).
   - Як додати тему (кроки, файли).
   - Приклад `bootstrap4.js` / `tailwind.js` з a11y (JEK-E4).
6. Повний Jekyll build: `bundle exec jekyll build` (без `--limit_posts`, ~15 хв).
   - Переконатися, що build успішний, помилок немає.
   - Перевірити, що `_site/**` згенеровано коректно.
7. Regenerate baked fragment: `node _form-engine/tools/gen-form-app.mjs` → `_includes/form/app/add-property.html`.
8. Перезахопити baseline для `verify-render`:
   - `powershell -File _form-engine/tools/verify-render.ps1 capture`
   - **Ручний перегляд** кожної розбіжності (як у JEK-R7/JEK-E2/JEK-E3).
   - Якщо зміни очікувані (a11y-розмітка, новий baked sha) — підтвердити.
   - Якщо несподівані — розслідувати і виправити до перезахоплення.
9. Прогнати **усі** item-гейти (повний сет):
   - `npm test`
   - 3× `validate-config --strict`
   - `check-add-property.mjs`
   - `check-notify.mjs`
   - `powershell -File _form-engine/tools/verify-render.ps1 verify`
10. Переконатися, що `git status` містить лише файли item-а (README, theming.md, baked fragment, baseline).
11. Дописати handoff, оновити рядок у `WORKITEMS.md`.

## Acceptance

- `jekyll build` (повний) завершується без помилок.
- `_form-engine/README.md` і `docs/form-engine/theming.md` актуальні для Phase 4 (E1..E4).
- Baked `_includes/form/app/add-property.html` свіжий; `form-app-fresh` зелений.
- Baseline `_form-engine/baseline/**` перезахоплено після ручного перегляду diff.
- **Усі гейти зелені**: `T` (228/228), `V` (3/3), `CA` PASS, `CN` ok, `VR` PASS.
- Змінені файли — лише в межах item-а; UTF-8 без BOM.

## Gates

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
node _form-engine/tools/check-notify.mjs
powershell -File _form-engine/tools/verify-render.ps1 verify
```

## Out of scope

- Зміна runtime, тем, binder, controller, конфігів, схеми, `_plugins/**` — це E1..E4.
- `reifua` / 11ty паритету — Phase 5 (EL-*).
- Публікація пакета `form-engine` — Phase 6 (PUB-*).
- Нові work items за межами build+docs.

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-08: Item створено з `_TEMPLATE.md` (spec-файл був відсутній). Специфікацію показано користувачу для затвердження до будь-яких змін коду. База — `realtyua/main`, гілка `feature/form-engine`, HEAD `78a3408e`, робоче дерево чисте. Worktree/гілка ще не створювалися.

- 2026-11-08: **JEK-E5 COMPLETED** ✅
  Worktree: `C:\Users\Vasyl\Documents\GitHub\realtyua\worktrees\JEK-E5-full-build-docs`
  Branch: `feat/JEK-E5-full-build-docs`
  
  **Files modified:**
  - `_form-engine/README.md` — оновлено migration status table (7c → done), додано розділ "Phase 4 — Jekyll engine (JEK-E1..E5)" з підсумками E1..E4
  - `_form-engine/baseline/.render-baseline.json` — оновлено метадані baseline (новий post path)
  - `_form-engine/baseline/new.html.txt` — перезахоплено baseline add-property сторінки
  
  **Files created:**
  - `docs/form-engine/theming.md` — новий файл: контракт теми, інтерфейс Theme, theme-neutral DOM hooks, класовий контракт, як додати тему, CSS tokens, post-E2 статус прогалин
  
  **Baked fragment:** `_includes/form/app/add-property.html` — unchanged (gen-form-app.mjs reports "unchanged")
  
  **Gates passed:**
  - `npm test` — 228/228 tests pass
  - `validate-config --strict` — 3/3 configs valid (add-property, notify, demo)
  - `check-add-property.mjs` — PASS (ID contract intact, no new static IDs)
  - `check-notify.mjs` — ok (1 page checked)
  - `verify-render verify` — PASS (all 3 tracked files byte-identical to baseline)
  - Full Jekyll build — SUCCESS (867s, 1428 posts processed)
  
  **Leftovers:** none — all changes within item scope
  **Commit SHA:** worktree HEAD (uncommitted changes)