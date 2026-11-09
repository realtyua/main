# EL-1 — Синхронізація рушія + hash-тест

Phase: 5 · Depends: JEK-E5 · Repo: reifua
Branch: `feat/EL-1-engine-sync` · Worktree: `../worktrees/EL-1-engine-sync`

Status: `done`

## Goal

Рушій `reifua/src/assets/js/form-engine/**` побайтово (з точністю до EOL)
збігається з `realtyua/assets/js/form-engine/**` після JEK-E2..E5, а hash-тест
фіксує цей знімок і падає, якщо рушій у reifua змінили без оновлення манифесту.

## Files

Джерело істини — `realtyua/main/assets/js/form-engine/`:

- `app.js`, `render.js`, `shell.js`, `controller.js`, `data.js`, `validation.js` — вже ідентичні (EOL-only)
- `binder.js` — 374 vs 326 рядків
- `modal-form.js` — інший зміст, 244 = 244
- `page-form.js` — 2398 vs 2331
- `themes/bootstrap4.js` — 835 vs 832
- `themes/tailwind.js` — 1007 vs 1004
- `themes/bootstrap4.css` — 208 vs 185
- `themes/tailwind.css` — 515 vs 477

Цільові шляхи — `reifua/main/src/assets/js/form-engine/…`.

Нове:

- `reifua/main/test/engine-hash.test.mjs` — hash-тест
- `reifua/main/test/engine-manifest.json` — нормалізовані SHA-256 файлів рушія

## Steps

1. Створити worktree `../worktrees/EL-1-engine-sync` від `reifua/main`
   (`feature/form-engine`), гілка `feat/EL-1-engine-sync`, junction `node_modules`.
2. Baseline: `npm test` + `npm run validate` у reifua до змін.
3. Скопіювати 7 розбіжних файлів з `realtyua` з нормалізацією EOL (LF) —
   `binder.js`, `modal-form.js`, `page-form.js`, `themes/bootstrap4.js`,
   `themes/tailwind.js`, `themes/bootstrap4.css`, `themes/tailwind.css`.
4. Перевірити, що `cursor-pointer`-розбіжності немає (ні в JS, ні в CSS).
5. Згенерувати `test/engine-manifest.json`: для кожного файлу рушія —
   `sha256` вмісту після нормалізації `\r\n` → `\n`.
6. Додати `test/engine-hash.test.mjs`: читає манифест, перераховує хеші,
   перевіряє повний набір файлів (нема зайвих/відсутніх), повідомляє про
   розбіжність з підказкою перегенерувати манифест.
7. Гейти item (див. нижче).

## Acceptance

- `git diff --stat` у reifua показує лише 7 файлів рушія + 2 нові файли тесту.
- Після синхронізації нормалізований вміст усіх файлів рушія збігається
  з `realtyua` (перевірено скриптом).
- `test/engine-hash.test.mjs` зелений; при навмисній зміні будь-якого файлу
  рушія — червоний з назвою файлу.
- `cursor-pointer` відсутній у рушії обох репозиторіїв.
- Наявні тести reifua не ламаються.

## Gates

`T` (reifua `npm test`), `V` (`npm run validate`), `B` (`npm run build`
або `npx eleventy`).

```powershell
npm test
npm run validate
npm run build
```

## Out of scope

- Сторінка add-property / demo / notify в 11ty (EL-2..EL-4).
- Passthrough і Tailwind purge (EL-5).
- Порти `check-add-property` / `check-notify` (EL-6, EL-7).
- Кросс-репозиторний parity-тест Jekyll ↔ 11ty (EL-8).
- Будь-які зміни в `realtyua` (там лише registry/спека).

## Handoff log

### 2026-11-09 — EL-1 (reifua)

**Status:** done (commit не створено — за політикою коміт робить користувач).

**Worktree/branch:** `C:\Users\Vasyl\Documents\GitHub\reifua\worktrees\EL-1-engine-sync`,
`feat/EL-1-engine-sync`, база `feature/form-engine` @ `7a95f78`.
`node_modules` — junction на `reifua/main/node_modules` (зняти перед `worktree remove`).

**Що змінено в reifua:**

| Файл | Дія |
| --- | --- |
| `src/assets/js/form-engine/binder.js` | синхронізовано з realtyua (JEK-E2/E4) |
| `src/assets/js/form-engine/modal-form.js` | синхронізовано |
| `src/assets/js/form-engine/page-form.js` | синхронізовано (2398 vs 2331) |
| `src/assets/js/form-engine/themes/bootstrap4.js` | синхронізовано |
| `src/assets/js/form-engine/themes/tailwind.js` | синхронізовано |
| `src/assets/js/form-engine/themes/bootstrap4.css` | синхронізовано |
| `src/assets/js/form-engine/themes/tailwind.css` | синхронізовано |
| `test/binder.test.mjs` | портовано 3 зміни з realtyua: `bootstrap4` import, `removeAttribute` у шимі, тест на спільний `validationClasses` |
| `_form-engine/tools/engine-manifest.mjs` | **новий** — генератор манифесту (`npm run engine:manifest`) |
| `test/engine-hash.test.mjs` | **новий** — 3 тести: покриття набору файлів, збіг хешів, метадані манифесту |
| `test/engine-manifest.json` | **новий** — 23 файли, sha256 після нормалізації CRLF→LF |
| `package.json` | додано скрипт `engine:manifest` |

**Перевірка синхронізації:** усі 23 файли рушія нормалізовано збігаються з
`realtyua/main/assets/js/form-engine/**`; зайвих/відсутніх немає.

**`cursor-pointer`:** залишився лише один легітимний вжиток — утиліта
`form-file` у `themes/tailwind.js` (`FILE_INPUT`). Обидва репозиторії тепер
ідентичні, тож «розбіжність» зникла самою синхронізацією; видаляти клас не
потрібно (він стилізує `::file-selector-button`).

**Гейти:**

| Гейт | Результат |
| --- | --- |
| `T` — `npm test` (reifua) | **212/212 pass** (baseline був 208/208; +3 engine-hash, +1 binder) |
| `V` — `npm run validate` | `src/_data/add-property.yml: valid` |
| `B` — `npm run build` | OK, Eleventy 1.0.2: copied 68 / wrote 23 files, `dist/new/index.html` на місці |
| Негативний тест hash-гейта | штучна правка `captcha.js` → `fail 1` з назвою файлу; файл відновлено |

**Leftover / далі:** тести `form-app-fresh.test.mjs`, `theme-render-parity.test.mjs`,
`theme-wire-parity.test.mjs` у reifua відсутні — вони належать EL-2/EL-3
(сторінка, теми, freshness). `render-tailwind.test.mjs` у reifua коротший
(399 vs 444) — це також EL-3.

**Commit SHA:** —

