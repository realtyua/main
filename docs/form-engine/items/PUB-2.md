# PUB-2 — Виділити `runtime/`

Phase: 6 · Depends: PUB-1 · Repo: form-engine
Branch: `feat/PUB-2-extract-runtime` · Worktree: `../worktrees/PUB-2-extract-runtime`

Status: `done`

## Goal

Скопіювати runtime Form Engine з `realtyua/main/assets/js/form-engine/` у новий репозиторій `form-engine/runtime/`. Runtime має бути чистим ES-модулем, незалежним від платформи (Jekyll/11ty), з двома темами (Tailwind, Bootstrap 4).

## Files

- `form-engine/runtime/` — цільова директорія
- `form-engine/runtime/themes/` — теми
- Джерело: `realtyua/main/assets/js/form-engine/**/*.js`, `**/*.css`

## Steps

1. Створити worktree для PUB-2 в `../worktrees/PUB-2-extract-runtime` з гілки `feature/form-engine` репозиторію `form-engine`
2. Перейти на гілку `feat/PUB-2-extract-runtime` в worktree
3. Створити junction на `node_modules` з canonical репозиторію
4. Скопіювати всі runtime файли з `realtyua/main/assets/js/form-engine/` в `form-engine/runtime/`
5. Переконатися, що структура відповідає плану:
   - `runtime/app.js`
   - `runtime/binder.js`
   - `runtime/captcha.js`
   - `runtime/conditions.js`
   - `runtime/controller.js`
   - `runtime/data.js`
   - `runtime/html.js`
   - `runtime/language.js`
   - `runtime/layout.js`
   - `runtime/modal-form.js`
   - `runtime/modals.js`
   - `runtime/model.js`
   - `runtime/page-form.js`
   - `runtime/render.js`
   - `runtime/shell.js`
   - `runtime/submit.js`
   - `runtime/validation.js`
   - `runtime/themeStyle.js`
   - `runtime/themes/tailwind.js`
   - `runtime/themes/tailwind.css`
   - `runtime/themes/bootstrap4.js`
   - `runtime/themes/bootstrap4.css`
6. Видалити `package.json` з runtime (він сайт-специфічний, не потрібен у публічному пакеті)
7. Запустити baseline gates (npm test тощо) щоб переконатися, що нічого не поламали
8. Зробити коміт
9. Оновити WORKITEMS.md

## Acceptance

- Всі runtime файли скопійовані в `form-engine/runtime/`
- Структура відповідає плану Phase 6
- Жоден файл не змінений (тільки копія)
- `package.json` НЕ скопійований в runtime/
- Gates проходять

## Gates

T (npm test в realtyua/main для перевірки, що джерело не поламали)

## Out of scope

- Адаптери (Jekyll/11ty) — PUB-3, PUB-4
- Tools, schema, tests — PUB-5
- package.json exports, versioning — PUB-6
- Examples — PUB-7
- README, docs — PUB-8, PUB-9
- CI, release — PUB-10

## Handoff log

- **2026-11-12**: status `review` — runtime extracted from `realtyua/main/assets/js/form-engine/` to `form-engine/runtime/` (22 files). Worktree created at `../worktrees/PUB-2-extract-runtime`, branch `feat/PUB-2-extract-runtime`. Junction to canonical `node_modules` created and removed. Gates run in `realtyua/main`: `npm test` (228/228 pass), `validate-config --strict` (3/3 configs valid), `check-add-property` (PASS), `verify-render` (3/3 files byte-identical to baseline). Commit `397c93c` in form-engine repo. No leftovers. WORKITEMS.md updated.
- **2026-11-12**: status `done` — merged `--no-ff` into `master` as commit `6a5a8df` (merge commit). Branch `feat/PUB-2-extract-runtime` can be deleted. PUB-3 (Jekyll adapter) now `ready`.