# PUB-15 — `runtime/package.json` у пакеті (`type: module`)

Phase: 6 · Depends: PUB-10 · Repo: form-engine
Branch: `feat/PUB-15-runtime-package-type` · Worktree: `../worktrees/PUB-15-runtime-package-type`

Status: `todo`

## Goal

Після документованого `cp -r runtime assets/js/form-engine` Node трактує runtime
як ESM без ручного створення `package.json` у сайті, тому `gen-form-app.mjs`
працює в чистому проєкті «як у README».

Знайдено в PUB-12 (F1): без цього файла `shell.js` вантажиться як CommonJS і
bake падає з `Named export 'renderPage' not found`.

## Files

- `runtime/package.json` — новий, `{ "type": "module" }` (як у
  `examples/jekyll/assets/js/form-engine/package.json`)
- `test/packaging.test.mjs` — перевірка, що файл є в tarball і що runtime
  резолвиться як ESM
- `CHANGELOG.md` — запис під наступний patch/minor

## Steps

1. Додати `runtime/package.json` з `{"type":"module"}`.
2. Переконатися, що `files: ["runtime/"]` тягне його в `npm pack` (перевірити
   `package/runtime/package.json` у tarball).
3. Додати в `test/packaging.test.mjs` перевірку наявності файла в tarball.
4. Прогнати офлайн smoke: чистий проєкт + tarball → `cp -r runtime
   assets/js/form-engine` → `node _form-engine/tools/gen-form-app.mjs` без
   ручних правок.

## Acceptance

- [ ] `npm pack` містить `package/runtime/package.json`
- [ ] Копія `runtime/` у сайт без `"type":"module"` дає робочий `gen-form-app.mjs`
- [ ] `examples/jekyll` більше не потребує власної копії цього файла (або
      залишається як дубль без розбіжностей)
- [ ] `npm test` і `npm run test:packaging` зелені

## Gates

```powershell
npm test
npm run test:packaging
npm pack --dry-run
```

## Out of scope

- Правки README/theming (PUB-17)
- Eleventy-адаптер (PUB-16)
- Перезахоплення baseline-гейтів Jekyll (це PUB-13)

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
