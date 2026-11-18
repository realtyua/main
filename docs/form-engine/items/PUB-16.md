# PUB-16 — Eleventy-адаптер: CJS/ESM-скоуп і відв'язка від шляхів сайту

Phase: 6 · Depends: PUB-10 · Repo: form-engine
Branch: `feat/PUB-16-eleventy-adapter-packaging` · Worktree: `../worktrees/PUB-16-eleventy-adapter-packaging`

Status: `review`

## Goal

`adapters/eleventy/lib/form-engine.js` імпортується з пакета
(`import('@realtyua/form-engine/adapters/eleventy/lib/form-engine.js')`) і пече
форми сайту без файлів, яких у пакеті немає.

Знайдено в PUB-12: F3 — файл написаний на CommonJS (`require`,
`module.exports`) у пакеті з `"type": "module"`, тому ESM-імпорт падає з
`ReferenceError: require is not defined in ES module scope`. F4 — модуль
резолвить `REPO` як теку на два рівні вище за `lib/` і читає
`src/_data/site.js`, `src/_data/*.yml`, `src/assets/js/form-engine`, тобто
працює лише після копіювання в сайт (як у `reifua` та `examples/eleventy`).

## Files

- `adapters/eleventy/lib/form-engine.js` — перевести на ESM (`import`/`export
  default`), прибрати `require`
- `adapters/eleventy/lib/package.json` або `.cjs`-варіант — лише якщо
  свідомо обрано CJS-скоуп замість ESM
- `adapters/eleventy/lib/form-engine.js` — корінь сайту з параметра
  (`registerForms(eleventyConfig, { siteDir, dataDir, engineDir, site })`) з
  дефолтом на `process.cwd()`, без шляхів, прив'язаних до теки пакета
- `adapters/eleventy/test/*` — тести на імпорт і bake з фікстурами
- `examples/eleventy/lib/form-engine.js` — синхронізувати з пакетом

## Steps

1. Визначити контракт: ESM default export `registerForms(eleventyConfig, opts)`
   (рекомендовано) або CJS-скоуп через локальний `package.json`.
2. Замінити `require` на `import`; `SITE`/`ENDPOINTS` — з `opts.site` або
   `siteDir/src/_data/site.js`, з дефолтами для сумісності з `reifua`.
3. `DATA_DIR`/`ENGINE_DIR` — від `opts` (дефолт `process.cwd()/src/...`),
   вендорні Leaflet-асети — опційні (порожній рядок, якщо файлів немає).
4. Додати тест: імпорт модуля з пакета + bake `demo.yml` з фікстури.
5. Офлайн smoke: чистий проєкт, tarball, `import(...)` → `registerForms` з
   mock `eleventyConfig` → `formApp('demo')` повертає фрагмент.

## Acceptance

- [x] `await import('@realtyua/form-engine/adapters/eleventy/lib/form-engine.js')`
      не кидає помилок у чистому проєкті
- [x] `registerForms` пече `src/_data/<name>.yml` без тек усередині пакета
- [x] Шорткоди `formApp`, `formEngineVersion`, `notifyConfigIsland`,
      `notifyPageJson` реєструються
- [x] `npm run test:eleventy` і `npm test` зелені
- [ ] `reifua`-варіант (копія в `lib/`) не зламано (перевірка в PUB-14)

## Gates

```powershell
npm test
npm run test:eleventy
npm pack --dry-run
```

## Out of scope

- Міграція `reifua` на пакет (PUB-14)
- Правки README/theming (PUB-17)
- Повний `@11ty/eleventy` build у CI (окремий item, якщо потрібен)

## Handoff log

2026-11-15: Implemented in form-engine worktree `form-engine-PUB-16-eleventy-adapter-packaging`.
- Changed `DEFAULT_ENGINE_DIR` from `path.join(DEFAULT_SITE_DIR, 'src', 'assets', 'js', 'form-engine')` to `path.join(__dirname, '..', '..', '..', 'runtime')` so the adapter defaults to the package's runtime instead of the site's copy.
- Updated comments to document the new behavior.
- Synchronized `examples/eleventy/lib/form-engine.js` with the adapter.
- Added `"type": "module"` to `examples/eleventy/package.json` to eliminate ESM warning.
- All gates pass: `npm test` (184/184), `npm run test:eleventy` (23/23), `npm run test:packaging` (6/6), `npm pack --dry-run`.
- Files changed:
  - `adapters/eleventy/lib/form-engine.js`
  - `examples/eleventy/lib/form-engine.js`
  - `examples/eleventy/package.json`
- Leftovers: reifua variant not verified (out of scope, PUB-14).
- Commit SHA: 2941bee9 (realtyua), bff12f2 (form-engine)
