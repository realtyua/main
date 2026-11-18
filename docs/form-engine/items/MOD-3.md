# MOD-3 — Оновити `actions/*` (прибрати застереження Node 20)

Phase: 8 · Depends: MOD-1 · Repo: reifua

Branch: `feat/MOD-3-actions-versions` · Worktree: `reifua/main` (зміна лише
YAML; junction на `node_modules` не потрібен, гейти виконуються в `main`)

Status: `review`

## Goal

Прибрати з Action застереження «Node.js 20 is deprecated». GitHub примусово
запускає старі `actions/*@v4` на Node 24, але самі теги ще задекларовані під
Node 20. Після item-а всі чотири кроки в `.github/workflows/main.yml`
використовують актуальні мажорні теги, що працюють на Node 24, без зміни
логіки workflow.

## Files

- `.github/workflows/main.yml`

## Steps

1. Звірити актуальні релізи через GitHub API (мережа погоджена для MOD-3):
   `actions/checkout`, `actions/setup-node`, `actions/upload-pages-artifact`,
   `actions/deploy-pages`.
2. Перевірити, що вхідні параметри, які використовує workflow, не змінилися:
   `node-version`/`cache` у `setup-node`, `path` в `upload-pages-artifact`.
3. Оновити теги:
   - `actions/checkout@v4` → `@v7` (останній реліз `v7.0.1`);
   - `actions/setup-node@v4` → `@v7` (останній реліз `v7.1.0`);
   - `actions/upload-pages-artifact@v3` → `@v5` (останній реліз `v5.0.0`;
     всередині вже `upload-artifact@v7`, що і прибирає друге застереження);
   - `actions/deploy-pages@v4` → `@v5` (останній реліз `v5.0.1`).
4. Перевірити YAML-парсинг і прогнати локальні гейти (build/test не залежать
   від workflow, але фіксують, що репо не зламане).

## Acceptance

- [x] `actions/checkout@v7`, `actions/setup-node@v7`,
      `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`
- [x] Вхідні параметри (`node-version: 24.x`, `cache: npm`, `path: dist`)
      сумісні з новими мажорами — звірено з `action.yml` на закріплених тегах
- [x] YAML парситься; `npm run build` 0; `T` 238/238
- [ ] Merge у `master` + `git push` (користувач) + зелений Action **без**
      застережень про Node 20

## Gates

```powershell
npm run build
npm test
```

Окремий YAML-парсинг: `js-yaml` на `.github/workflows/main.yml` (тимчасовий
скрипт поза репо).

## Out of scope

- Зміна `node-version` (уже `24.x` після MOD-1) або структури jobs
- Інші `actions/*` (у workflow їх немає)
- Піновані SHA замість мажорних тегів — окреме рішення, якщо знадобиться
- `git push`, реліз, MERGE-2

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-18: **bump actions** (гілка `feat/MOD-3-actions-versions` від
  `master` @ `4c94ecc`).

  Версії звірено через GitHub API (`/releases/latest`):
  `checkout` `v7.0.1`, `setup-node` `v7.1.0`,
  `upload-pages-artifact` `v5.0.0`, `deploy-pages` `v5.0.1`. У
  `upload-pages-artifact@v5.0.0` у `action.yml` вхід `path` лишився
  обов'язковим, а всередині — `actions/upload-artifact@v7.0.0` (це і є
  джерело застереження `upload-artifact@v4` у старому `@v3`). У
  `setup-node@v7.1.0` входи `node-version` і `cache` без змін; `runs.using`
  — `node24`. `checkout@v7` і `deploy-pages@v5` використовуються без входів.

  Зміна: `.github/workflows/main.yml` — 4 теги.

  Гейти: YAML парситься (`js-yaml`), `npm run build` 0,
  `npm test` **238/238**.

  Item-коміт `a2dbcb3`, merge `--no-ff` `494de8b` у `master`, гілку
  видалено (`master` ahead 2; push — користувач).

  Leftovers: `git push` і перевірка зеленого Action без застережень
  «Node.js 20 is deprecated» — користувач; після цього status → `done`.
