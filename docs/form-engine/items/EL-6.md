# EL-6 — Порт `check-add-property`

Phase: 5 · Depends: EL-2 · Repo: reifua
Branch: `feat/EL-6-check-add-property` · Worktree: `../worktrees/EL-6-check-add-property`

Status: `review`

## Goal

Портити Jekyll-інструмент `_form-engine/tools/check-add-property.mjs` у reifua як `tools/check-add-property.mjs` (або `_form-engine/tools/check-add-property.mjs` для парності). Інструмент порівнює запечений HTML фрагмент add-property з baseline (`_form-engine/baseline/add-property.html`) і виявляє:
- copy-drift (текстові розбіжності: labels, helpers, placeholders, validation messages)
- структурні розбіжності (відсутні/лишні поля, зміна порядку, `file-info` widget)

## Files

- `_form-engine/tools/check-add-property.mjs` — **новий/порт** з Jekyll `_form-engine/tools/check-add-property.mjs`
- `_form-engine/baseline/add-property-old.txt` — baseline (копія Jekyll `add-property-old.txt` для парності гейтів)
- `package.json` — скрипт `check:add-property` → `node _form-engine/tools/check-add-property.mjs`
- `test/check-add-property.test.mjs` — **новий** (опціонально): unit-тести для детекторів drift

## Steps

1. `session_move` на `reifua/main`, worktree `../worktrees/EL-6-check-add-property`, гілка `feat/EL-6-check-add-property`, junction `node_modules`
2. Baseline: `npm test`, `npm run validate`, `npm run build` до змін
3. Скопіювати/портнути Jekyll `check-add-property.mjs` → reifua `_form-engine/tools/check-add-property.mjs`:
   - Замінити Jekyll-шляхи (`_includes/form/app/`, `_site/`) на Eleventy (`src/_includes/...`, `dist/`)
   - Адаптувати парсинг baked HTML (Eleventy фрагмент має ту саму структуру: config island + form markup)
   - Зберегти логіку нормалізації (EOL, whitespace, атрибут order) — має співпадати з Jekyll
4. Скопіювати Jekyll baseline `_form-engine/baseline/add-property-old.txt` → reifua `_form-engine/baseline/add-property-old.txt` для парності гейтів
5. Додати npm script `check:add-property`
6. Запустити інструмент — має показати той самий результат, що й Jekyll версія (після JEK-R4: 0 failures, PASS)
7. Гейти item

## Acceptance

- `_form-engine/tools/check-add-property.mjs` існує і запускається: `node _form-engine/tools/check-add-property.mjs`
- Вивід ідентичний Jekyll-версії: **0 failures, PASS** (після JEK-R4 baseline reconciliation)
- Baseline `_form-engine/baseline/add-property-old.txt` скопійовано з Jekyll для парності
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

- 2026-11-10: Session started, worktree `../worktrees/EL-6-check-add-property`, branch `feat/EL-6-check-add-property`, junction `node_modules` created.
- 2026-11-10: Baseline gates before changes: `npm test` (239 pass), `npm run validate` (valid), `npm run build` (success).
- 2026-11-10: Ported `_form-engine/tools/check-add-property.mjs` from Jekyll:
  - Updated config path: `_data/add-property.yml` → `src/_data/add-property.yml`
  - Updated imports: `../../assets/js/form-engine/` → `../../src/assets/js/form-engine/`
  - Updated baseline path: `add-property-old.txt` (Jekyll old page baseline)
  - Updated normalize call for baseline: `{ alpine: true, dataAttr: false }` (Jekyll baseline has Alpine attrs)
  - Kept ACCEPTED_COPY_EDITS table and normalization logic identical to Jekyll.
- 2026-11-10: Copied Jekyll baseline `_form-engine/baseline/add-property-old.txt` to reifua for gate parity.
- 2026-11-10: Added npm script `check:add-property` to `package.json`.
- 2026-11-10: **Fixed theme-aware rendering**: Updated `FormRender.render(config)` to `FormRender.render(config, { theme: config.theme || 'bootstrap4' })` so the tool respects the config's theme (bootstrap4 for add-property, tailwind for demo).
- 2026-11-10: **Fixed mojibake corruption**: During porting, UTF-8 encoding was corrupted in ACCEPTED_COPY_EDITS and structural check regexes. Restored both sections from Jekyll source file to fix 13 copy-edit mappings and 4 structural check patterns.
- 2026-11-10: Gates after all fixes:
  - `npm test`: 239 pass, 0 fail
  - `npm run validate`: valid
  - `npm run build`: success
  - `npm run check:add-property`: PASS (0 failures, matches Jekyll post-JEK-R4 behavior)
- 2026-11-10: Note: EL-6 spec referenced "14 failures" from pre-JEK-R4 state. After JEK-R3/JEK-R4, Jekyll `check-add-property` passes (0 failures). Reifua port matches this behavior.
- 2026-11-10: Leftover: temporary extraction scripts removed. No baseline file `_form-engine/baseline/add-property.html` created (spec mentioned it but Jekyll baseline is `add-property-old.txt`; current Eleventy output matches engine render so separate baseline not needed for this gate).
- 2026-11-10: Ready for review. Commit SHA: (agent does not commit).