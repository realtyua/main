# PUB-12 — Перевірка установки пакету (`npm install @realtyua/form-engine`) в чистому проекті

Phase: 6 · Depends: PUB-10 · Repo: form-engine
Branch: `feat/PUB-12-install-smoke-test` · Worktree: `../worktrees/PUB-12-install-smoke-test`

Status: `blocked`

## Goal

Переконатися, що пакет `@realtyua/form-engine@1.0.0` встановлюється з публічного npm і працює в чистому проєкті (Jekyll + Bootstrap 4 і Eleventy + Tailwind).

## Files

-тимчасова тека для smoke-test (не комітиться)
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
- [ ] Jekyll-адаптер копіюється і bake працює — лише з ручним
      `assets/js/form-engine/package.json`; як у README — падає (F1, F2)
- [ ] Eleventy-адаптер імпортується і passthrough copy працює — падає (F3, F4, F5)
- [ ] Жодних помилок залежностей або missing files — F2, F5

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

  **Гейти.**

  | Гейт | Результат |
  | --- | --- |
  | Baseline `npm test` (worktree, до змін) | 183/183 pass |
  | `npm pack` | 66 файлів, 324 758 B |
  | `npm install --offline <tgz>` (jekyll-test) | OK, 25 packages |
  | `import('@realtyua/form-engine/runtime/app.js')` | OK |
  | `import('@realtyua/form-engine/runtime/render.js')` | OK (`FormRender`) |
  | `schema/form-config.schema.json` у пакеті | є |
  | Jekyll `validate-config.mjs --strict` | `valid (schema version 1, id "demo")` |
  | Jekyll `gen-form-app.mjs` як у README | **FAIL** — `Named export 'renderPage' not found ... shell.js is a CommonJS module` (F1) |
  | Jekyll `gen-form-app.mjs` після `{"type":"module"}` | OK — 13 191 chars, маркер `sha=e0cf52d6…` |
  | Jekyll `jekyll build` (4.4.1, ruby 3.4.10) | OK — `FormEngine: baked demo`; у `_site/index.html` є `form-bake` і `/assets/js/form-engine/app.js?v=5166ac6f0f36` |
  | `import('@realtyua/form-engine/adapters/eleventy/lib/form-engine.js')` | **FAIL** — `ReferenceError: require is not defined in ES module scope` (F3) |
  | `require(...)` того ж адаптера (CJS-контекст) | **FAIL** — `Cannot find module '../src/_data/site.js'` (F4) |
  | `npm install --offline @11ty/eleventy` | ENOTCACHED — у кеші немає (F8) |
  | Eleventy-адаптер, скопійований у `lib/` + mock `eleventyConfig` | OK — шорткоди `formApp, formEngineVersion, notifyConfigIsland, notifyPageJson`, bake 22 334 chars |

  **Знахідки (поза scope PUB-12 — verification item).**

  - **F1 (blocker).** У пакеті немає `runtime/package.json` з `{"type":"module"}`.
    Після документованого `cp -r runtime assets/js/form-engine` Node трактує
    runtime-файли як CJS (у сайта немає `"type":"module"`), і `gen-form-app.mjs`
    падає на `import { renderPage } from '../../assets/js/form-engine/shell.js'`.
    `examples/jekyll/assets/js/form-engine/package.json` цей файл має, README — ні.
  - **F2.** README крок 6: `cp -r adapters/jekyll/schema _form-engine/schema` —
    у пакеті немає `adapters/jekyll/schema`; схема лежить у корені `schema/`.
    Копіювання падає, `validate-config.mjs` не знаходить схему.
  - **F3 (blocker).** `adapters/eleventy/lib/form-engine.js` — CommonJS
    (`require`/`module.exports`) у пакеті з `"type":"module"`; ESM-імпорт із
    README неможливий.
  - **F4 (blocker).** Адаптер прив'язаний до шляху сайту: `REPO` = тека на два
    рівні вище за `lib/`, далі `src/_data`, `src/assets/js/form-engine`,
    `src/_data/site.js`. У пакеті цих тек немає, тому модуль не працює in place —
    його треба копіювати в сайт (як у `reifua` та `examples/eleventy`).
  - **F5.** Passthrough у README і `docs/theming-guide.md` вказує
    `node_modules/form-engine/runtime` (старе unscoped ім'я); правильно —
    `node_modules/@realtyua/form-engine/runtime`.
  - **F6.** README: «zero runtime dependencies», хоча `package.json` має
    `iconv-lite`, `js-yaml`, `linkedom`.
  - **F7.** Кореневий `tools/` пакета містить лише `check-*`, `validate-config`,
    `yaml`; `gen-form-app`/`site-opts`/`verify-render` є тільки в
    `adapters/jekyll/tools` (README туди й посилає — не дефект, але дублювання).
  - **F8.** Перевірити публікацію `v1.0.0` у реєстрі офлайн неможливо; тег
    `v1.0.0` локально є (`ac78f37`).

  **Files changed.** У `form-engine` — жодного файла (worktree чистий, лише
  gitignored junction). У `realtyua` — `docs/form-engine/items/PUB-12.md`,
  `docs/form-engine/WORKITEMS.md`.

  **Leftovers.** (1) Дефекти F1–F5 не виправлялися: це зміна пакета, а не
  verification item. Відкрито нові item-и: PUB-15 — `runtime/package.json` у
  пакеті; PUB-16 — Eleventy-адаптер (CJS/ESM-скоуп і відв'язка від шляхів
  сайту); PUB-17 — README/theming (шляхи `schema/` і `@realtyua/…`, заява про
  залежності). (2) Повний `@11ty/eleventy` build не запускався (немає в кеші);
  перевірено mock-конфігом. (3) Установка з публічного реєстру — за користувачем
  після publish. (4) Junction і worktree прибираються після рішення щодо F1–F5.
  (5) Повторна перевірка PUB-12 — після PUB-15..PUB-17.

  **Commit SHA:** немає — нічого не комітилося (політика сесії).