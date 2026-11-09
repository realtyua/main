# EL-6 — Порт `check-add-property`

Phase: 5 · Depends: EL-2 · Repo: reifua
Branch: `feat/EL-6-check-add-property` · Worktree: `../worktrees/EL-6-check-add-property`

Status: `todo`

## Goal

Портити Jekyll-інструмент `_form-engine/tools/check-add-property.mjs` у reifua як `tools/check-add-property.mjs` (або `_form-engine/tools/check-add-property.mjs` для парності). Інструмент порівнює запечений HTML фрагмент add-property з baseline (`_form-engine/baseline/add-property.html`) і виявляє:
- copy-drift (текстові розбіжності: labels, helpers, placeholders, validation messages)
- структурні розбіжності (відсутні/лишні поля, зміна порядку, `file-info` widget)

## Files

- `_form-engine/tools/check-add-property.mjs` — **новий/порт** з Jekyll `_form-engine/tools/check-add-property.mjs`
- `_form-engine/baseline/add-property.html` — **оновлений** baseline (після EL-2/EL-3/EL-4 змін; заморозити поточний стан)
- `package.json` — скрипт `check:add-property` → `node _form-engine/tools/check-add-property.mjs`
- `test/check-add-property.test.mjs` — **новий** (опціонально): unit-тести для детекторів drift

## Steps

1. `session_move` на `reifua/main`, worktree `../worktrees/EL-6-check-add-property`, гілка `feat/EL-6-check-add-property`, junction `node_modules`
2. Baseline: `npm test`, `npm run validate`, `npm run build` до змін
3. Скопіювати/портнути Jekyll `check-add-property.mjs` → reifua `_form-engine/tools/check-add-property.mjs`:
   - Замінити Jekyll-шляхи (`_includes/form/app/`, `_site/`) на Eleventy (`src/_includes/...`, `dist/`)
   - Адаптувати парсинг baked HTML (Eleventy фрагмент має ту саму структуру: config island + form markup)
   - Зберегти логіку нормалізації (EOL, whitespace, атрибут order) — має співпадати з Jekyll
4. Оновити/зафіксувати `_form-engine/baseline/add-property.html` поточним виводом `dist/new/index.html` (витягнути фрагмент між маркерами)
5. Додати npm script `check:add-property`
6. Запустити інструмент — має показати ті самі 14 failures (13 copy-drift + `file-info`), що й Jekyll версія
7. Гейти item

## Acceptance

- `_form-engine/tools/check-add-property.mjs` існує і запускається: `node _form-engine/tools/check-add-property.mjs`
- Вивід ідентичний Jekyll-версії: 14 відомих failures (список у `items/JEK-R3.md` / `JEK-R4.md`)
- Baseline `_form-engine/baseline/add-property.html` оновлений до поточного стану reifua
- `npm run check:add-property` працює
- Не розширюємо scope: не "лікуємо" baseline, не послаблюємо нормалізатор

## Gates

`T` (reifua `npm test`), `V` (`npm run validate`), `B` (`npm run build`), `CA` (`npm run check:add-property`).

```powershell
npm test
npm run validate
npm run build
npm run check:add-property
```

## Out of scope

- Порт `check-notify` — EL-7.
- Freshness + parity-тест Jekyll ↔ 11ty — EL-8.
- Виправлення drift-у (це окремні item-и або ручне прийняття baseline).

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->