# PUB-14 — Міграція `reifua` на npm пакет (локально, гейти, без пушу)

Phase: 6 · Depends: PUB-12 · Repo: reifua
Branch: `feat/PUB-14-reifua-migrate-npm` · Worktree: `../worktrees/PUB-14-reifua-migrate-npm`

Status: `done`

## Goal

Переключити `reifua/main` (Eleventy + Tailwind) з локальних копій `src/assets/js/form-engine/`, `lib/form-engine.js` на встановлений з npm пакет `@realtyua/form-engine`. Переконатися, що всі гейти проходять.

## Files

- `package.json` — додати `@realtyua/form-engine` як dependency
- `.eleventy.js` — оновити імпорт адаптера з пакету
- Passthrough copy runtime з `node_modules/@realtyua/form-engine/runtime`
- Eleventy config якщо треба

## Steps

1. Створити worktree `PUB-14-reifua-migrate-npm` від `main` репозиторію `reifua`.
2. Усередині worktree: `git checkout -b feat/PUB-14-reifua-migrate-npm`.
3. Junction на канонічний `node_modules`: `cmd /c mklink /J node_modules ..\..\main\node_modules`.
4. **package.json**: додати `"@realtyua/form-engine": "^1.0.0"` в dependencies.
5. **Eleventy adapter**: оновити `.eleventy.js`:
   ```js
   // Було: import formEngine from "../form-engine/adapters/eleventy/lib/form-engine.js"
   // Стало: import formEngine from "@realtyua/form-engine/adapters/eleventy/lib/form-engine.js"
   ```
6. **Passthrough copy runtime**: оновити `.eleventy.js`:
   ```js
   eleventyConfig.addPassthroughCopy({
     "node_modules/@realtyua/form-engine/runtime": "assets/js/form-engine"
   });
   ```
7. Видалити локальні копії (якщо є):
   - `src/assets/js/form-engine/` (якщо була копія)
   - `lib/form-engine.js` (якщо був локальний адаптер)
8. Запустити **gates**:
   - `npm test` (form-engine tests з пакету)
   - `npm run test:eleventy` (adapter tests)
   - `node tools/validate-config.mjs` на конфігах reifua
   - `npm run build` — повний Eleventy build
   - Перевірити сторінки з формами (add-property, demo, notify)
9. Задокументувати результат.

## Acceptance

- [ ] `package.json` має `@realtyua/form-engine` dependency
- [ ] `.eleventy.js` імпортує адаптер з пакету
- [ ] Passthrough copy runtime з `node_modules/@realtyua/form-engine/runtime`
- [ ] Жодних локальних копій form-engine коду в репозиторії
- [ ] Всі тести проходять (T, E, V)
- [ ] Eleventy build успішний
- [ ] Сторінки з формами працюють (add-property, demo, notify)

## Gates

```powershell
# Tests:
npm test
npm run test:eleventy

# Validate configs:
node tools/validate-config.mjs src/_data/add-property.yml --strict
node tools/validate-config.mjs src/_data/notify.yml --strict
node tools/validate-config.mjs src/_data/demo.yml --strict

# Build:
npm run build
```

## Out of scope

- Пуш у `reifua/main` (master) — лише після повної перевірки і вашого «прийнято»
- CI/CD для reifua (окремий item)
- Production deploy

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- **2026-11-18 — review** (repo: `reifua`, worktree: `C:\Users\Vasyl\Documents\GitHub\reifua\worktrees\PUB-14-reifua-migrate-npm`, branch: `feat/PUB-14-reifua-migrate-npm` @ `db8ff5e`, base: `feature/form-engine` per user direction; all changes uncommitted, no commit/merge/push)
  - **Prep/env (local, no network install):** `npm ci` виконано користувачем у `reifua\main` (на `master`, потім на `feature/form-engine`); worktree створено з `feature/form-engine`; junction `node_modules` → `C:\Users\Vasyl\Documents\GitHub\reifua\main\node_modules`; локальний пакет підключено junction-ом `reifua\main\node_modules\@realtyua\form-engine` → `C:\Users\Vasyl\Documents\GitHub\form-engine` (v1.0.3).
  - **Baseline (до міграційних змін, `db8ff5e`):** `npm run build` PASS; `node _form-engine/tools/validate-config.mjs src/_data/{add-property,notify,demo}.yml --strict` PASS (3/3); `npm run check:add-property` PASS; `npm run check:notify` PASS (після build); `npm test` **241 pass / 4 fail** (`all baked fragments in dist/ are fresh`, `add-property fragment parity (both stacks from same config)`, `demo fragment parity (both stacks from same config)`, `notify config island parity (Jekyll baseline modal vs reifua dist modal)`).
  - **Migration/files changed (reifua worktree):** `package.json` (+`@realtyua/form-engine` dep); `.eleventy.js` → імпорт Eleventy-адаптера з пакету (CJS/Eleventy 1.x-safe, з `{ site, siteDir, dataDir, engineDir }`) + passthrough runtime `node_modules/@realtyua/form-engine/runtime` → `assets/js/form-engine`; видалено локальні копії `src/assets/js/form-engine/**` і `lib/form-engine.js`; оновлено тести/інструменти на package-backed runtime/adapter (`test/*` імпорти `@realtyua/form-engine/runtime/*`, bake через пакетний adapter у `test/add-property-page.test.mjs`, `test/demo-page.test.mjs`, `test/notify-page.test.mjs`, parity shell import, `_form-engine/tools/check-{add-property,notify}.mjs`, `_form-engine/tools/verify-render.mjs`); `test/engine-hash.test.mjs` адаптовано до package-backed стану (local engine snapshot lock not applicable when `src/assets/js/form-engine` absent); `test/parity-jekyll-11ty.test.mjs` — EOL-нормалізація у `normalizeParity` для стабільного порівняння. `dist/` перебудовано.
  - **Gates (post-migration, `C:\Users\Vasyl\Documents\GitHub\reifua\worktrees\PUB-14-reifua-migrate-npm`):** `npm run build` PASS (`[11ty] Copied 71 files / Wrote 24 files`, exit 0); `node _form-engine/tools/validate-config.mjs src/_data/add-property.yml --strict` PASS; `.../notify.yml --strict` PASS; `.../demo.yml --strict` PASS; `npm run check:add-property` PASS; `npm run check:notify` PASS (`ok (10 page(s) checked)`); `npm test` PASS (**239 pass / 0 fail / 0 skip / 0 todo**, exit 0). `npm run test:eleventy` і `node tools/validate-config.mjs ...` у цьому стані репо відсутні (скрипт/шлях зі спеки не збігаються з фактичними); використано фактичні еквіваленти вище.
  - **Acceptance notes:** dependency, package adapter import, runtime passthrough, відсутність локальних копій engine/adapter-коду — виконано; build/валідація/check/tests зелені; сторінки з формами (add-property/demo/notify) збираються й проходять check-notify/check-add-property.
  - **Local cycle (після «прийнято», reifua):** commit `9685757` (`PUB-14: migrate reifua to npm package`), merge `--no-ff` `559e1b0` у `feature/form-engine`; гілку `feat/PUB-14-reifua-migrate-npm` видалено, worktree `../worktrees/PUB-14-reifua-migrate-npm` прибрано; junction-и `worktree/node_modules` та тимчасовий `reifua\main\node_modules\@realtyua\form-engine` знято. `reifua/main` на `feature/form-engine` (ahead of origin, push — користувач). Commit SHA (item): `9685757`.