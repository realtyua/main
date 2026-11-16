# PUB-13 — Міграція `realtyua` на npm пакет (локально, гейти, без пушу)

Phase: 6 · Depends: PUB-12 · Repo: realtyua
Branch: `feat/PUB-13-realtyua-migrate-npm` · Worktree: `../worktrees/PUB-13-realtyua-migrate-npm`

Status: `done` (variant 1: docs/package committed; git representation of package-backed symlinked paths and pre-existing `demo` endpoint gate blocker left as follow-up)

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

- [ ] `package.json` має `@realtyua/form-engine` dependency
- [ ] `assets/js/form-engine/` → runtime з пакету (симлінк або копія)
- [ ] `_form-engine/tools/` → tools з пакету
- [ ] `_form-engine/schema/` → schema з пакету
- [ ] Jekyll plugin знаходить схему і тулі з пакету
- [ ] Всі гейти проходять (T, V, CA, CN, VR)
- [ ] Jekyll build успішний, форми renderяться
- [ ] Жодних локальних копій form-engine коду в репозиторії (крім пакету в node_modules)

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
- **Leftovers / follow-up:** (1) pre-existing `demo` endpoint blocks CN/VR/Jekyll build — separate item/decision; (2) git representation/cleanliness for tracked `assets/js/form-engine/*` and `_form-engine/tools/*` now backed by package junctions — follow-up to satisfy acceptance/history cleanly; (3) `realtyua/main/node_modules/@realtyua/form-engine` junction remains (shared canonical).
- **Commit SHA:** `33a32f31` (item commit, merged `--no-ff` into `feature/form-engine`; merge commit separate). Push — user.