# MERGE-2 — Merge `feature/form-engine` → `master` (`realtyua`)

Phase: 7 · Depends: MERGE-1 · Repo: realtyua

Branch: `—` · Worktree: `—`

Status: `todo`

## Goal

Інтегрувати завершену гілку `feature/form-engine` в `master` репозиторію `realtyua` локально (без push). Гілки дивергували (у `master` є окремі коміти), тому можливі конфлікти — очікувано перевірити щонайменше `_config.yml`.

## Steps

1. У `C:\Users\Vasyl\Documents\GitHub\realtyua\main` переконатися, що робоче дерево чисте і локальні гілки у очікуваному стані (`origin/*` синхронізовано користувачем; `git fetch` агент не виконує).
2. `git checkout master`
3. `git merge --no-ff feature/form-engine` (повідомлення узгодити, рекомендовано: `Merge branch 'feature/form-engine'`).
4. Якщо є конфлікти: зупинитися, показати конфліктні файли/фрагменти, узгодити розв’язання (не втратити актуальні зміни `master` і зміни form-engine), після «прийнято» — `git add` явних файлів і завершити merge-коміт.
5. (Рекомендовано) прогнати узгоджені гейти/збірку після merge на `master` (напр. релевантні перевірки/`npm run build` для Jekyll-сайту) за наявності середовища.
6. Зафіксувати результат у handoff (SHA merge-коміту, конфлікти/рішення, гейти). Локальний commit реєстру/доків — за протоколом після «прийнято».
7. `git push` `master` (і за потреби рішення щодо гілки `feature/form-engine`) — **користувач**.

## Acceptance

- [ ] `master` містить зміни `feature/form-engine`
- [ ] Конфлікти (зокрема можливий `_config.yml`) розв’язані узгоджено, merge завершено
- [ ] Узгоджені гейти/перевірки після merge виконані (або зафіксовано, що пропущено і чому)
- [ ] Handoff оновлено; `git push` виконано користувачем

## Gates

```powershell
# уточнити в сесії (приклад)
npm run build
# + наявні check/validate-скрипти проєкту за потреби
```

## Out of scope

- `git push/fetch/pull/rebase/reset --hard/commit --amend`, теги, force-push (агент)
- Зміни поза інтеграцією гілок і необхідним розв’язанням конфліктів

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
