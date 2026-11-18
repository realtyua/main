# PUB-17 — README/theming: шляхи копіювання та заяви про залежності

Phase: 6 · Depends: PUB-10 · Repo: form-engine
Branch: `feat/PUB-17-docs-paths-deps` · Worktree: `../worktrees/PUB-17-docs-paths-deps`

Status: `review`

## Goal

Інструкції в `README.md` і `docs/` виконуються буквально в чистому проєкті:
шляхи копіювання існують у пакеті, passthrough вказує на scoped-ім'я, а заява
про залежності відповідає `package.json`.

Знайдено в PUB-12: F2 — `cp -r adapters/jekyll/schema _form-engine/schema`, але
в пакеті немає `adapters/jekyll/schema` (схема — в корені `schema/`); F5 —
passthrough і theming вказують `node_modules/form-engine/runtime` (старе
unscoped ім'я); F6 — «zero runtime dependencies», хоча `package.json` має
`iconv-lite`, `js-yaml`, `linkedom`.

## Files

- `README.md:42` — заява про залежності (уточнити: runtime без залежностей,
  tools/адаптери тягнуть `js-yaml`, `iconv-lite`, `linkedom`)
- `README.md:128-136` — крок 6: `adapters/jekyll/schema` → `schema`
- `README.md:178-184` — Eleventy: passthrough
  `node_modules/@realtyua/form-engine/runtime` (узгодити з PUB-16)
- `README.md:241-242` — коментар про runtime
- `docs/migration-guide.md:491` — той самий passthrough-шлях
- `docs/theming-guide.md:235,240` — `./node_modules/@realtyua/form-engine/runtime/themes/tailwind.js`

## Steps

1. Замінити всі `node_modules/form-engine/` на
   `node_modules/@realtyua/form-engine/`.
2. Виправити крок копіювання схеми на кореневий `schema/`.
3. Переписати речення про залежності так, щоб воно збігалося з `dependencies`
   у `package.json` (і пояснити, що browser-runtime їх не імпортує).
4. Перевірити, що Eleventy-приклад відповідає контракту PUB-16.
5. Прогнати пошук на залишки старих шляхів.

## Acceptance

- [ ] `grep -r "node_modules/form-engine"` не дає збігів у `README.md`, `docs/`
- [ ] `grep -r "adapters/jekyll/schema"` не дає збігів
- [ ] Кроки README (Jekyll) виконуються в чистому проєкті без «немає такого файла»
- [ ] Твердження про залежності збігається з `package.json`
- [ ] `npm pack --dry-run` без змін у складі пакета

## Gates

```powershell
npm test
npm pack --dry-run
# вручну: grep-перевірки з Acceptance
```

## Out of scope

- Код пакета (PUB-15, PUB-16)
- Переписування README цілком

## Handoff log

- **2026-11-15**: status `review` — documentation paths fixed in form-engine worktree
  `C:\Users\Vasyl\Documents\GitHub\worktrees\PUB-17-docs-paths-deps`, branch
  `feat/PUB-17-docs-paths-deps` (junction to canonical `node_modules` created at
  `..\..\form-engine\node_modules`, removed before worktree cleanup).

  Files changed:
  - `README.md` — fixed 3 issues:
    1. Line 42: clarified "zero runtime dependencies" → "zero browser-runtime dependencies" with explanation that `iconv-lite`, `js-yaml`, `linkedom` are for tools/adapters only
    2. Line 134: fixed schema copy path from `adapters/jekyll/schema` → `schema` (root schema directory)
    3. Line 183: fixed Eleventy passthrough from `node_modules/form-engine/runtime` → `node_modules/@realtyua/form-engine/runtime`
  - `docs/migration-guide.md:491` — fixed Eleventy passthrough to scoped package name
  - `docs/theming-guide.md:235,240` — fixed Tailwind SAFELIST import paths to scoped package name

  Gates:
  - **T** `npm test`: **184/184 pass** (baseline unchanged).
  - **PACK** `npm pack --dry-run`: **PASS** — package composition unchanged (69 files, 326.9 kB).
  - **GREP** `grep -r "node_modules/form-engine" README.md docs/`: **no matches**.
  - **GREP** `grep -r "adapters/jekyll/schema" .`: **no matches**.
  - **DEPS** dependency statement now matches `package.json` — clarifies browser-runtime vs tools/adapters.

  Deviations / notes:
  - All changes are documentation-only; no code changes in `runtime/`, `adapters/`, `schema/`, `tools/`, `test/`, `examples/`.
  - All files verified UTF-8 without BOM.
  - The Eleventy example (`.eleventy.js`) correctly uses local `src/assets/js/form-engine/` copy; README documents the installed package path.

  Leftovers / out of scope:
  - None.

  Commit SHA: 3a44099 (form-engine).
