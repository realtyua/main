# MOD-1 — Node 24 + Eleventy 3.1.8 (CI fix, Tailwind без плагіна)

Phase: 8 · Depends: MERGE-1 · Repo: reifua

Branch: `feat/MOD-1-eleventy3-node24` · Worktree: `reifua/main` (worktree не
використовувався: `npm ci/install` має перезібрати `node_modules`, junction
тут не працює)

Status: `review`

## Goal

Полагодити деплой `reifua` на GitHub Pages: Action падав у кроці
`Install dependencies & build`, бо CI брав Node 18, а `@realtyua/form-engine@1.0.4`
вимагає `node >=20` і `.eleventy.js` робив `require()` ESM-адаптера
(`ERR_REQUIRE_ESM`). Заодно оновити Eleventy до 3.1.8 і прибрати
`eleventy-plugin-tailwindcss`, який монкі-патчить прототип Eleventy і не
працює на v3.

## Steps

1. Baseline на `master` @ `24d3a5b`: build 0, `T` 238/238, `V` valid, `CA` PASS,
   `CN` ok.
2. CI: `node-version: 18.x` → `24.x` у `.github/workflows/main.yml`.
3. `npm install @11ty/eleventy@^3.1.8`; `npm ci` для перевірки lockfile.
4. Конфіг Eleventy переведено на ESM: `.eleventy.js` → `eleventy.config.mjs`
   (`import`, `import.meta.url` замість `__dirname`, `i18n.json` через
   `readFileSync`).
5. Заміна `eleventy-plugin-tailwindcss` на явний крок `lib/build-css.mjs`
   (postcss + tailwindcss + autoprefixer + clean-css; `--serve`/`--watch`
   спавнять Eleventy і перебудовують CSS на зміни).
6. Гейти після змін; handoff.

## Acceptance

- [x] CI-воркфлоу на Node 24; `engines.node >= 20` у `package.json`
- [x] Eleventy 3.1.8; конфіг ESM; `npm ci` + `npm run build` зелені
- [x] Tailwind-плагін прибрано, CSS збирається тим самим стеком
- [x] `T` 238/238, `V` valid, `CA` PASS, `CN` ok, `VR` 42/42
- [ ] Merge у `master` + `git push` (користувач) + зелений Action

## Gates

```powershell
npm ci
npm run build
npm test
npm run validate
npm run check:add-property
npm run check:notify
npm run verify:render
```

## Out of scope

- Tailwind 2 → 4 (окремий item: інший CSS-пайплайн і re-baseline)
- Оновлення інших залежностей (`luxon`, `terser`, `html-minifier`, ...)
- `@11ty/eleventy-upgrade-help` лишається (не використовується в конфізі)
- `git push`, реліз, MERGE-2

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-18: **upgrade + CI fix** (гілка `feat/MOD-1-eleventy3-node24` від
  `master` @ `24d3a5b`, локально, без push).

  Причина падіння Action (`errors` у `reifua/main`): Node 18.x у workflow,
  `engines` пакета `>=20`, `require(ESM)` адаптера в CJS-конфізі
  (`ERR_REQUIRE_ESM`). Додатково `eleventy-plugin-tailwindcss@0.3.0`
  (git+ssh, 2021) на Eleventy 3 падає з `Cannot read properties of undefined
  (reading 'watch')` — він патчить `Eleventy.prototype.watch`, якого в v3
  немає.

  Зміни (`reifua`):
  - `.github/workflows/main.yml`: `node-version: 24.x`;
  - `package.json`: `@11ty/eleventy ^3.1.8`, `engines.node >=20`,
    `tailwindcss ^2.2.19`, `postcss ^8.4.6`, `autoprefixer ^10.1.0`,
    `clean-css ^4.2.3` у devDependencies; прибрано
    `eleventy-plugin-tailwindcss`; скрипти `build`/`serve`/`watch` тепер
    викликають `lib/build-css.mjs`;
  - `.eleventy.js` → `eleventy.config.mjs` (ESM; логіка фільтрів/колекцій/
    passthrough без змін);
  - новий `lib/build-css.mjs`: postcss + tailwind + autoprefixer + clean-css,
    пише `dist/assets/css/*.css`, у `--serve`/`--watch` спавнить Eleventy і
    перебудовує CSS на зміни `src/assets/css` та `tailwind.config.js`.

  Важливо: `build` виконує CSS-крок під `NODE_ENV=production` — інакше
  Tailwind 2 не вмикає purge (перший прогін дав `main.css` 3.37 MB; після
  виправлення — 19 361 B).

  Гейти (Node 24.18.0): `npm ci` ok, `npm run build` 0,
  `npm test` **238/238**, `validate --strict` valid, `check:add-property`
  PASS, `check:notify` ok (10 pages), `verify:render` **42/42**. HTML
  `dist/**` не змінився (freshness/parity-тести зелені без re-baseline).

  Leftovers: merge у `master` (бо після MERGE-1 інтеграційна гілка `reifua` —
  `master`) після «прийнято»; `git push` і перевірка зеленого Action —
  користувач; Tailwind 4 — окремий item. Файл `errors` у корені `reifua`
  лишається untracked (не додається).

- 2026-11-18: **прийнято → локальний цикл виконано** (`reifua`).

  Item ліг **двома комітами** (staging-помилка: перший `git add` з
  неіснуючим `pathspec` відмовив повністю, тому перший коміт містить лише
  видалення `.eleventy.js`):
  - `bdd6df2` — `MOD-1: upgrade to Eleventy 3 and Node 24` (видалення
    `.eleventy.js`);
  - `ad87a29` — `MOD-1: replace tailwind plugin, ESM config, Node 24 CI`
    (решта: `eleventy.config.mjs`, `lib/build-css.mjs`, `package.json`,
    `package-lock.json`, workflow).

  Merge `--no-ff` у `reifua/master` — `156fd37`; гілку
  `feat/MOD-1-eleventy3-node24` видалено. Після merge на `master` повторно:
  `npm run build` 0, `npm test` **238/238**, `V` valid, `CA` PASS, `CN` ok,
  `VR` 42/42.

  Статус лишається `review`: `master` на 3 коміти попереду `origin/master`,
  push і зелений Action — за користувачем. Після зеленого деплою MOD-1 і
  MERGE-1 можна переводити в `done`.
