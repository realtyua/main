# PUB-14 — Міграція `reifua` на npm пакет (локально, гейти, без пушу)

Phase: 6 · Depends: PUB-12 · Repo: reifua
Branch: `feat/PUB-14-reifua-migrate-npm` · Worktree: `../worktrees/PUB-14-reifua-migrate-npm`

Status: `todo`

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