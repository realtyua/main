# PUB-12 — Перевірка установки пакету (`npm install @realtyua/form-engine`) в чистому проекті

Phase: 6 · Depends: PUB-10 · Repo: form-engine
Branch: `feat/PUB-12-install-smoke-test` · Worktree: `../worktrees/PUB-12-install-smoke-test`

Status: `done`

## Goal

Переконатися, що пакет `@realtyua/form-engine@1.0.0` встановлюється з публічного npm і працює в чистому проєкті (Jekyll + Bootstrap 4 і Eleventy + Tailwind).

## Files

- тимчасова тека для smoke-test (не комітиться)
- `package.json` тестового проєкту
- простий конфіг форми

## Steps

1. Створити worktree `PUB-12-install-smoke-test` від `main` репозиторію `form-engine`.
2. Усередині worktree: `git checkout -b feat/PUB-12-install-smoke-test`.
3. Junction на канонічний `node_modules`: `cmd /c mklink /J node_modules ..\..\main\node_modules` (без `npm install`).
4. Створити тимчасову папку `smoke-test/` поряд з worktree.
5. Протестувати **Jekyll-сценарий**:
   - `mkdir jekyll-test && cd jekyll-test`
   - `npm init -y`
   - `npm install @realtyua/form-engine`
   - Перевірити, що `node_modules/@realtyua/form-engine/runtime/app.js` існує
   - Перевірити імпорт: `node --input-type=module -e "await import('@realtyua/form-engine/runtime/app.js'); console.log('OK')"`
   - Перевірити адаптер: скопіювати `adapters/jekyll/_plugins` і `tools`, схему — перевірити bake
6. Протестувати **Eleventy-сценарий**:
   - `mkdir eleventy-test && cd eleventy-test`
   - `npm init -y`
   - `npm install @11ty/eleventy js-yaml @realtyua/form-engine`
   - Перевірити імпорт адаптера: `await import('@realtyua/form-engine/adapters/eleventy/lib/form-engine.js')`
   - Перевірити passthrough copy runtime
7. Задокументувати результат (успіх/проблеми) в handoff log.

## Acceptance

- [x] `npm install @realtyua/form-engine` успішний в чистій папці
      (офлайн: локальний tarball; установка з реєстру не запускалася — F8)
- [x] Runtime імпортується: `import('@realtyua/form-engine/runtime/app.js')`
- [x] Jekyll-адаптер копіюється і bake працює — `gen-form-app.mjs` та `jekyll build` успішні
- [x] Eleventy-адаптер імпортується і passthrough copy працює — `import(...)` успішний, bake через mock Eleventy успішний
- [x] Жодних помилок залежностей або missing files

## Gates

```powershell
# Вручну в smoke-test папках:
npm install @realtyua/form-engine
node --input-type=module -e "await import('@realtyua/form-engine/runtime/app.js'); console.log('runtime OK')"
node --input-type=module -e "await import('@realtyua/form-engine/adapters/eleventy/lib/form-engine.js'); console.log('eleventy adapter OK')"
```

## Out of scope

- Повна інтеграція в realtyua/reifua (це PUB-13/PUB-14)
- Публікація smoke-test проєктів

## Handoff log

- **2026-11-15**: status `blocked` — офлайн smoke-test установки пакета.
  Гілка `feat/PUB-12-install-smoke-test`, worktree
  `X:/OpenCodeData/opencode/worktree/247de9/PUB-12-install-smoke-test`
  (junction `node_modules` → `C:\Users\Vasyl\Documents\GitHub\form-engine\node_modules`).

  **Оточення.** Мережа заборонена, тому замість `npm install @realtyua/form-engine`
  з реєстру — `npm pack` з worktree і `npm install --offline <tarball>`:
  `realtyua-form-engine-1.0.0.tgz`, 66 файлів, 324 758 B,
  shasum `ff9ea45ae311f7243643ea73e4bf4d5a7b27f94e`.
  Обидва чисті проєкти: `added 25 packages`, без помилок.
  Смоук-теки (не комітяться):
  `%TEMP%\opencode\pub-12\{jekyll-test,eleventy-test}`.

  **Гейти (оновлено після PUB-15..PUB-17).**

  | Гейт | Результат |
  | --- | --- |
  | Baseline `npm test` (worktree, до змін) | 184/184 pass |
  | `npm pack` | 69 файлів, 327 000 B |
  | `npm install --offline <tgz>` (jekyll-test) | OK, 25 packages |
  | `import('@realtyua/form-engine/runtime/app.js')` | OK |
  | `import('@realtyua/form-engine/runtime/render.js')` | OK (`FormRender`) |
  | `schema/form-config.schema.json` у пакеті | є |
  | Jekyll `validate-config.mjs --strict` | `valid (schema version 1, id "demo")` |
  | Jekyll `gen-form-app.mjs` (як у README, runtime має package.json) | OK — 13 191 chars, маркер `sha=7384fc07…` |
  | Jekyll `jekyll build` (4.4.1, ruby 3.4.10) | OK — `FormEngine: baked demo`; у `_site/index.html` є `form-bake` і `/assets/js/form-engine/app.js?v=5166ac6f0f36` |
  | `import('@realtyua/form-engine/adapters/eleventy/lib/form-engine.js')` | OK — ESM-імпорт успішний |
  | Eleventy-адаптер через mock (opts: siteDir, engineDir) | OK — шорткоди `formApp, formEngineVersion, notifyConfigIsland, notifyPageJson`, bake 22 334 chars |

  **Знахідки (початковий run — F1..F8 у попередньому handoff).**

  Усі блокуючі знахідки (F1, F3, F4, F5) виправлені в PUB-15, PUB-16, PUB-17:
  - F1: додано `runtime/package.json` (`{"type":"module"}`)
  - F2: README виправлено — копіювання схеми з кореня `schema/`
  - F3: Eleventy-адаптер переписано на ESM (`import`/`export default`)
  - F4: адаптер приймає `opts` (`engineDir`, `dataDir`, `siteDir`, `site`)
  - F5: шляхи в README/migration/theming виправлені на `@realtyua/form-engine`
  - F6: формулювання про залежності уточнено

  **Files changed.** У `form-engine` — коміти PUB-15 (`404f6c2`), PUB-16 (`d08a8c3`, `bff12f2`), PUB-17 (`3a44099`). У `realtyua` — `docs/form-engine/items/PUB-12.md`, `docs/form-engine/WORKITEMS.md`.

  **Leftovers.** (1) Повний `@11ty/eleventy` build не запускався офлайн (немає в кеші) — перевірено mock-конфігом. (2) Установка з публічного реєстру — за користувачем після publish (`git tag v1.0.0 && git push origin v1.0.0`). (3) Junction і worktree PUB-12 прибрані.

  **Commit SHA:** `fbcbc6e` (merge PUB-16) / `3eae097` (merge PUB-17) / `f73892e` (merge PUB-15) у `form-engine`; `719ba5fd` (merge PUB-12 docs) у `realtyua/main`.