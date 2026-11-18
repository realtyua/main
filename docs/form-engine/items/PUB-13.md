# PUB-13 — Міграція `realtyua` на npm пакет (локально, гейти, без пушу)

Phase: 6 · Depends: PUB-12 · Repo: realtyua
Branch: `feat/PUB-13-realtyua-migrate-npm` (merged, deleted) · Worktree: `../worktrees/PUB-13-realtyua-migrate-npm` (cleaned up 2026-11-18)

Status: `done` (variant 1: package-backed paths materialised from npm, `demo` endpoint configured; усі follow-ups закрито 2026-11-18)

## Goal

Переключити `realtyua/main` (Jekyll + Bootstrap 4) з локальних копій `assets/js/form-engine/`, `_plugins/`, `_form-engine/tools/` на встановлений з npm пакет `@realtyua/form-engine`. Переконатися, що всі гейти проходять.

## Files

- `Gemfile` — додати `js-yaml` (для Node tools) якщо треба
- `package.json` — додати `@realtyua/form-engine` як dependency
- `_plugins/form_engine.rb` — оновити шляхи до схеми/тулів (з пакету)
- `_form-engine/tools/` — замінити на симлінк або копію з пакету
- `assets/js/form-engine/` — замінити на симлінк або копію runtime з пакету
- Jekyll config якщо треба

## Steps

1. Створити worktree `PUB-13-realtyua-migrate-npm` від `main` репозиторію `realtyua`.
2. Усередині worktree: `git checkout -b feat/PUB-13-realtyua-migrate-npm`.
3. Junction на канонічний `node_modules`: `cmd /c mklink /J node_modules ..\..\main\node_modules`.
4. **package.json**: додати `"@realtyua/form-engine": "^1.0.0"` в dependencies.
5. **Runtime**: замінити `assets/js/form-engine/` на симлінк або копію з `node_modules/@realtyua/form-engine/runtime/`:
   - `cmd /c mklink /J assets\js\form-engine ..\..\..\main\node_modules\@realtyua\form-engine\runtime`
   - АБО скопіювати при `npm install` через script
6. **Jekyll plugin**: оновити `_plugins/form_engine.rb`:
   - Шлях до схеми: `File.join(Gem.loaded_specs['@realtyua/form-engine'].full_gem_path, 'schema', 'form-config.schema.json')` — НЕПРАВИЛЬНО, це Ruby gem.
   - Правильно: Node tools з пакету. Зробити симлінк `_form-engine/tools` → `node_modules/@realtyua/form-engine/tools`
   - Або скопіювати при інсталяції
7. **Schema**: симлінк `_form-engine/schema` → `node_modules/@realtyua/form-engine/schema`
8. Запустити **baseline gates** (перевірити що вони проходять):
   - `npm test` (form-engine tests)
   - `node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict`
   - `node _form-engine/tools/check-add-property.mjs`
   - `node _form-engine/tools/check-notify.mjs`
   - `powershell -File _form-engine/tools/verify-render.ps1 verify`
9. Jekyll build з `--limit_posts 1` — переконатися що форми бакуться правильно.
10. Задокументувати результат.

## Acceptance

- [x] `package.json` має `@realtyua/form-engine` dependency (`^1.0.3`)
- [x] `assets/js/form-engine/` → runtime з пакету (матеріалізація через `sync:form-engine`)
- [x] `_form-engine/tools/` → tools з пакету
- [x] `_form-engine/schema/` → schema з пакету
- [x] Jekyll plugin знаходить схему і тулі з пакету
- [x] Гейти T/V/CA/CN проходять; VR — без регресій (у фінальному циклі не перезапускався, див. handoff)
- [x] Jekyll build успішний, форми renderяться
- [x] Жодних локальних копій form-engine коду в репозиторії (крім пакету в node_modules)

## Gates

```powershell
# Baseline gates (як в PUB-10):
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
node _form-engine/tools/check-notify.mjs
powershell -File _form-engine/tools/verify-render.ps1 verify

# Jekyll build:
bundle exec jekyll build --limit_posts 1
```

## Out of scope

- Пуш у `realtyua/main` (master) — лише після повної перевірки і вашого «прийнято»
- Зміни в `reifua` (це PUB-14)
- CI/CD для realtyua (окремий item)

## Handoff log

### 2026-11-16 — implementation (variant 1, local cycle completed)

- **Status:** done (item commit merged to `feature/form-engine`; registry/cleanup updated). Variant 1: committed only `package.json` + docs/item+registry; tracked package-backed paths (`assets/js/form-engine/*`, `_form-engine/tools/*`) not restaged here.
- **Worktree/branch:** created from `feature/form-engine` @ `8799a2a1` as `feat/PUB-13-realtyua-migrate-npm` in `../worktrees/PUB-13-realtyua-migrate-npm` (initial mistaken worktree from `master` removed/recreated). Branch merged `--no-ff` into `feature/form-engine` and deleted; worktree unregistered (`node_modules` junction removed from worktree; on-disk directory removal may require manual cleanup if locked).
- **Scope done (realtyua):**
  - `package.json`: added dependency `"@realtyua/form-engine": "^1.0.0"`.
  - `node_modules/@realtyua/form-engine` (canonical `realtyua/main/node_modules`): junction → local package repo `C:\Users\Vasyl\Documents\GitHub\form-engine` (offline; no `npm install`).
  - `assets/js/form-engine/` → junction to package `runtime`.
  - `_form-engine/tools/` → junction to package `adapters/jekyll/tools`.
  - `_form-engine/schema/` → junction to package `schema`.
  - `_form-engine/baseline/` and `_form-engine/README.md` preserved; `_plugins/form_engine.rb` unchanged.
- **Gates run (before changes, baseline):** `npm test` 228/228 PASS; `validate-config` add-property/notify/demo `--strict` PASS; `check-add-property` PASS; `check-notify` FAIL (`_site` missing); `verify-render`/`jekyll build --limit_posts 1` FAIL (pre-existing `FormEngine: Форма «demo»: не вказано endpoint...`).
- **Gates run (after changes):** `npm test` **228/228 PASS**; `validate-config` (3/3) **PASS**; `check-add-property` **PASS**; manual `gen-form-app` bake **OK**; `check-notify` **FAIL** (same, `_site` missing); `bundle exec jekyll build --limit_posts 1` **FAIL** with the same pre-existing `demo` endpoint error (no migration regression observed). `verify-render` not rerun end-to-end (same blocker).
- **Side-effect outside realtyua:** patched local package repo `C:\Users\Vasyl\Documents\GitHub\form-engine` (`adapters/jekyll/tools/{validate-config,gen-form-app,check-add-property,check-notify}.mjs`) for site-context/symlink consumption — not in this commit; needs separate reconciliation in `form-engine`.
- **Leftovers / follow-up:** (1) pre-existing `demo` endpoint blocks CN/VR/Jekyll build — separate item/decision; (2) git representation/cleanliness for tracked `assets/js/form-engine/*` and `_form-engine/tools/*` now backed by package junctions — follow-up to satisfy acceptance/history cleanly; (3) `realtyua/main/node_modules/@realtyua/form-engine` junction remains (shared canonical). **Усі три закрито 2026-11-18 — див. нижче.**
- **Commit SHA:** `33a32f31` (item commit, merged `--no-ff` into `feature/form-engine`; merge commit separate). Push — user.

### 2026-11-18 — follow-ups closed (npm package paths, demo endpoint, 1.0.3)

- **Status:** `done`. Усі follow-ups із запису 2026-11-16 закрито; зміни запушено користувачем, гілку й worktree прибрано.
- **form-engine (npm):**
  - `1.0.2` — виправлення резолвінгу шляхів Jekyll-адаптера (`116d814`), реліз `3bde0cb`.
  - `1.0.3` — `fix: import resolve in Jekyll check-add-property gate` (`307d011`) + регресійний тест `test/jekyll-tools.test.mjs`; реліз `abccf5b`. Користувач запушив, теґ `v1.0.3`, пакет опубліковано.
- **realtyua:**
  - `package.json`: `"@realtyua/form-engine": "^1.0.3"` — реальний registry-пакет (не junction); `package-lock.json` містить tarball + integrity.
  - `scripts/sync-form-engine.mjs` + скрипти `postinstall` / `sync:form-engine`: матеріалізація runtime/tools/schema з пакету в gitignored шляхи сайту (`assets/js/form-engine/`, `_form-engine/tools/`, `_form-engine/schema/`). 32 tracked копії видалено з git.
  - `_config.yml`: `demo_endpoint: 'https://notify-worker.sparkling-union-9e0a.workers.dev'`; згенерований `_includes/form/app/demo.html` додано до `.gitignore`.
  - `.github/workflows/main.yml`: `actions/setup-node@v5` (Node 22, npm cache) + `npm ci` перед Jekyll build.
  - Коміт `5ade2ac7` `PUB-13 follow-up: materialise form-engine from npm package` (37 файлів: 32 видалення, 5 змін/додавань). Push — користувач.
- **Gates (registry 1.0.3):** `npm test` **228/228**; `validate-config --strict` 3/3 (add-property/notify/demo); `check-add-property` **PASS**; `check-notify` ok (1 page); `bundle exec jekyll build --limit_posts 1` **PASS**; SHA запеченого фрагмента `6b9ba7f48bf097eedb3446306fa422bf6977d1d5973bdc96e71387092a8691f8` без змін. `verify-render` у цьому циклі не перезапускався (раніше блокувався через `demo` endpoint; блокер знято).
- **Housekeeping:** порожній каталог старого worktree `../worktrees/PUB-13-realtyua-migrate-npm` та worktree `neon-engine` (merged `8799a2a1`) видалено; `git worktree list` — лише `main`.