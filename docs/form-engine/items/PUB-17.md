# PUB-17 — README/theming: шляхи копіювання та заяви про залежності

Phase: 6 · Depends: PUB-10 · Repo: form-engine
Branch: `feat/PUB-17-docs-paths-deps` · Worktree: `../worktrees/PUB-17-docs-paths-deps`

Status: `todo`

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

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
