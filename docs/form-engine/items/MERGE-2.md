# MERGE-2 — Merge `feature/form-engine` → `master` (`realtyua`)

Phase: 7 · Depends: MERGE-1 · Repo: realtyua

Branch: `—` · Worktree: `—`

Status: `done`

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

- 2026-11-18: **merged locally** у `C:\Users\Vasyl\Documents\GitHub\realtyua\main`
  (`master`), за специфікою item-а (Branch/Worktree `—`: без item-worktree й гілки
  `feat/*`, без junction). Статус `review` — merge-коміт створено, `push` виконує
  користувач.

  Стан до merge: `main` чистий на `feature/form-engine`; `master` @ `6d8bbeec`,
  feature @ `0ef96b72` (12 комітів лише в `master` — контент сайту; ~150 лише у
  feature). `git merge-tree` передбачив один конфлікт — `_config.yml`.

  Конфлікт: один коментований рядок у `defaults[0].scope`. У `master` рядка немає,
  у `feature/form-engine` — `#path: /*/data/*.json`. За погодженням користувача
  лишено рядок із feature; `git add _config.yml` (лише явний файл).

  Merge: `git checkout master` + `git merge --no-ff feature/form-engine -m
  "Merge branch 'feature/form-engine'"` → merge-коміт
  `80e9e38c2fd2cd0852561d00caad73308d198f68` (батьки `6d8bbeec`, `0ef96b72`).
  Після merge робоче дерево чисте; `master` містить `feature/form-engine`.

  Гейти:
  - Baseline (до merge, `master`): `bundle exec jekyll build --limit_posts 1` —
    **BLOCKED** локальним оточенням Ruby (`cannot load such file -- tzinfo` під
    Bundler 4; звичайний `jekyll` — конфлікт `addressable 2.9.2` vs `2.9.0` у
    Gemfile). Gem-и не встановлювалися (офлайн-політика).
  - Після merge на `master`: `npm test` — **228/228**; `validate --strict` —
    **3/3 valid** (`add-property`, `notify`, `demo`); `check-add-property` —
    **PASS**; Jekyll build усередині `verify-render` — **0** (175 с, рендер
    170.9 с), `check-notify` — **ok (1 page)**.
  - `verify-render.ps1 verify` — **FAIL 2/3**, обидві розбіжності застарілі й не
    спричинені merge: (а) `new.html` — лише `form-bake sha` `0651f32a…` →
    `08e2d3c7…` (baseline захоплено 2026-11-08, а PUB-18 rebake `e301affb`
    змінив sha 2026-11-18; злитий `_config.yml` і `_data/add-property.yml`
    ідентичні feature-гілці); (б) NEW POST — у baseline
    `district/town/kosiv/apartment/prodam-1789988154.html`, у збірці
    `region/city/yaremche/house/prodam-budynok-1794757537.html` з нових комітів
    `master`. Baseline **свідомо не перезахоплювався**.

  Файли, змінені merge: увесь tracked-набір `feature/form-engine` увійшов у
  `master`; єдина ручна правка — `_config.yml` (розв'язання конфлікту). Інших
  змін коду не вносилося.

  Leftovers:
  - `git push origin master` (і рішення щодо подальшої долі
    `feature/form-engine`) — **користувач**.
  - Перезахоплення baseline `verify-render` з переглядом двох розбіжностей —
    окремий свідомий акт, тут не виконувався.
  - Помилка резолюції gem-ів на чистому `master` до merge — локальне оточення,
    окреме розслідування.
  - Не tracked-залишки npm-копій (`_form-engine/tools/*`, `assets/js/form-engine/*`,
    `_includes/form/app/demo.html`) були на `master` ще до merge; після merge
    покриті `.gitignore` feature-гілки; не чіпалися.
  - Цей handoff і оновлення `WORKITEMS.md` лишаються **некоміченими** у робочому
    дереві за правилами сесії.

  Commit SHA (merge): `80e9e38c2fd2cd0852561d00caad73308d198f68`.

- 2026-11-18 (після push): **done** — користувач запушив `master`
  (`26b6c47b` — docs-коміт item-а, поверх merge-коміту `80e9e38c`); Action
  зелений. MERGE-2 закрито, статус у реєстрі — `done`.

  Примітка: після push у `master` з'явився окремий коміт користувача `fd4978c6`
  («Toggle line comment 893-921», `_data/add-property.yml`, 29+/29−) — не частина
  MERGE-2, цим item-ом не зачіпався. Може вплинути на `form-bake sha` / baseline
  `verify-render` — окреме рішення.

- 2026-11-20: обидві застарілі розбіжності, зафіксовані вище в MERGE-2
  (`form-bake sha` і NEW POST), **свідомо перезахоплено** в MOD-8:
  `capturedAt = 2026-11-20T09:27:32.288Z`, трекована property-сторінка —
  `region/city/yaremche/house/prodam-budynok-1794757537.html`. `verify` після
  `capture` — 3/3 PASS. Деталі й повний перегляд diff — `items/MOD-8.md`.
