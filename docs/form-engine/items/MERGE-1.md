# MERGE-1 — Merge `feature/form-engine` → `master` (`reifua`)

Phase: 7 · Depends: BASE-6 · Repo: reifua

Branch: `master` (reifua, без item-гілки) · Worktree: `reifua/main`

Status: `done`

## Goal

Інтегрувати завершену гілку `feature/form-engine` в `master` репозиторію `reifua` локально (без push). У `master` немає власних комітів відносно merge-base, тому конфліктів не очікується.

## Steps

1. У `C:\Users\Vasyl\Documents\GitHub\reifua\main` переконатися, що робоче дерево чисте і локальні `master`/`feature/form-engine` відповідають очікуваному стану (`origin/*` синхронізовано користувачем; `git fetch` агент не виконує).
2. `git checkout master`
3. `git merge --no-ff feature/form-engine` (повідомлення узгодити, рекомендовано: `Merge branch 'feature/form-engine'`). Альтернатива за рішенням: fast-forward.
4. (Опційно, за погодженням) прогнати перевірки після merge на `master` (напр. `npm test`, `npm run check:add-property`, `npm run check:notify`, `npm run build`) за наявності середовища/залежностей.
5. Зафіксувати результат у handoff (SHA merge-коміту, гейти, стан). Локальний commit реєстру/доків — за протоколом після «прийнято».
6. `git push` `master` (і за потреби рішення щодо гілки `feature/form-engine`) — **користувач**.

## Acceptance

- [x] `master` містить зміни `feature/form-engine` (merge або FF за узгодженням)
- [x] Конфліктів немає або вони розв’язані й узгоджені
- [x] Узгоджені гейти/перевірки після merge виконані (або зафіксовано, що пропущено і чому)
- [x] Handoff оновлено; `git push` виконано користувачем

## Gates

```powershell
# приклад (уточнити в сесії)
npm test
npm run check:add-property
npm run check:notify
npm run build
```

## Out of scope

- Merge `realtyua` (MERGE-2)
- `git push/fetch/pull/rebase/reset --hard/commit --amend`, теги, force-push (агент)

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-18: **merged locally** (`reifua/main`, гілка `master`, без worktree
  й item-гілки — merge-айтем).

  Стан до merge: `feature/form-engine` @ `dcf1ee7`, робоче дерево чисте;
  `master` @ `b27fe4d` = merge-base (власних комітів немає), 24 коміти
  попереду. Baseline-гейти на `feature/form-engine`: `npm run build` — 0,
  `npm test` — **238/238**, `validate --strict` — valid,
  `check:add-property` — PASS, `check:notify` — ok (10 pages). Перший прогін
  `npm test` падав лише на freshness/parity через відсутній `dist` — після
  `build` зелено.

  Merge: `git checkout master` + `git merge --no-ff feature/form-engine`
  (стратегія `ort`), повідомлення `Merge branch 'feature/form-engine'`.
  Конфліктів немає. 56 файлів, +26 229/−64.

  Гейти після merge на `master`: `npm run build` — 0, `npm test` —
  **238/238**, `validate --strict` — valid, `check:add-property` — PASS,
  `check:notify` — ok (10 pages). `verify:render` не запускався — його
  немає в гейтах item-а.

  Локальний стан: `master` @ `6da93db` (merge-коміт), на 1 коміт попереду
  `origin/master`; гілка `feature/form-engine` @ `dcf1ee7` не видалена.
  Репо `reifua` лишено на `master`.

  Leftovers: `git push origin master` — користувач; рішення щодо долі гілки
  `feature/form-engine` після push — за користувачем. Коміт реєстру/доків у
  `realtyua` — після «прийнято».

- 2026-11-18 (продовження): користувач запушив `master` (`24d3a5b`,
  `Change url in the menu`), але Action `Install dependencies & build` упав:
  Node 18.x проти `engines >=20` і `require(ESM)` адаптера. Merge-частина
  item-а не винна — відкрито **MOD-1** (Node 24 + Eleventy 3.1.8, локально
  зелено). MERGE-1 лишається `review`, доки деплой не стане зеленим; push
  MERGE-1 вважається виконаним.

- 2026-11-18 (продовження 3): **done** — push + зелений Action (деплой
  пройшов на Node 24). Єдине застереження Action — «Node.js 20 is deprecated»
  для `actions/*@v4` (не помилка); `/demo` після деплою втратив стилі →
  MOD-2.
