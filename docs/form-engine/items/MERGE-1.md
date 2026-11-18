# MERGE-1 — Merge `feature/form-engine` → `master` (`reifua`)

Phase: 7 · Depends: BASE-6 · Repo: reifua

Branch: `—` · Worktree: `—`

Status: `ready`

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

- [ ] `master` містить зміни `feature/form-engine` (merge або FF за узгодженням)
- [ ] Конфліктів немає або вони розв’язані й узгоджені
- [ ] Узгоджені гейти/перевірки після merge виконані (або зафіксовано, що пропущено і чому)
- [ ] Handoff оновлено; `git push` виконано користувачем

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
