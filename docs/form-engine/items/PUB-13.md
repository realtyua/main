# PUB-13 — Міграція `realtyua` на npm пакет (локально, гейти, без пушу)

Phase: 6 · Depends: PUB-12 · Repo: realtyua
Branch: `feat/PUB-13-realtyua-migrate-npm` · Worktree: `../worktrees/PUB-13-realtyua-migrate-npm`

Status: `todo`

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

### 2026-11-16 — implementation (option 1, no commit)

- **Status:** review (migration implemented locally; full VR/CN/Jekyll build blocked by pre-existing baseline condition, no regression observed). Not committed/merged.
- **Worktree/branch:** `C:\Users\Vasyl\Documents\GitHub\realtyua\worktrees\PUB-13-realtyua-migrate-npm` on `feat/PUB-13-realtyua-migrate-npm` (created from `feature/form-engine` @ `8799a2a1`, not from `master`; initial mistaken worktree from `master` was removed and recreated correctly).
- **Scope done (realtyua):**
  - `package.json`: added dependency `"@realtyua/form-engine": "^1.0.0"`.
  - `node_modules/@realtyua/form-engine` (in canonical `realtyua/main/node_modules`, visible via worktree junction): junction → local package repo `C:\Users\Vasyl\Documents\GitHub\form-engine` (offline; no `npm install`).
  - `assets/js/form-engine/` replaced by junction → `node_modules/@realtyua/form-engine/runtime`.
  - `_form-engine/tools/` replaced by junction → `node_modules/@realtyua/form-engine/adapters/jekyll/tools` (keeps site-relative plugin/tool paths working).
  - `_form-engine/schema/` replaced by junction → `node_modules/@realtyua/form-engine/schema`.
  - `_form-engine/baseline/` and `_form-engine/README.md` preserved; `_plugins/form_engine.rb` unchanged (tool/schema paths remain valid via symlinks).
- **Gates run (before changes, baseline):** `npm test` 228/228 PASS; `validate-config` add-property/notify/demo `--strict` PASS; `check-add-property` PASS; `check-notify` FAIL (`_site` missing); `verify-render.ps1 verify` FAIL (`jekyll build --limit_posts 1` → `FormEngine: Форма «demo»: не вказано endpoint. Додайте submit.action у _data/demo.yml або demo_endpoint у _config.yml.`) — pre-existing, no `_site` produced.
- **Gates run (after changes):** `npm test` **228/228 PASS**; `validate-config` add-property/notify/demo `--strict` **PASS** (via package tools through junction); `check-add-property` **PASS**; `check-notify` **FAIL** for same pre-existing reason (`_site` missing); `bundle exec jekyll build --limit_posts 1` **FAIL** with the **same** pre-existing `demo` endpoint error as baseline (no regression from migration); `gen-form-app.mjs` manual bake to temp file **OK**. `verify-render.ps1 verify` not rerun end-to-end (blocked by same pre-existing build failure).
- **Side-effect outside realtyua worktree (reported):** patched local package repo `C:\Users\Vasyl\Documents\GitHub\form-engine` (adapters/jekyll/tools: `validate-config.mjs`, `gen-form-app.mjs`, `check-add-property.mjs`, `check-notify.mjs`) to resolve schema/runtime/site root when consumed from a site context (symlinked/installed-package usage). These edits are **not** in this realtyua worktree/commit; they affect the shared local `form-engine` repo and may need a separate upstream/package change/review.
- **Leftovers / risks:** (1) `check-notify`, `verify-render`, and `bundle exec jekyll build --limit_posts 1` remain blocked by pre-existing `demo` endpoint config (outside PUB-13 scope; not fixed here per option 1). (2) `_site` absent in worktree. (3) `node_modules/@realtyua/form-engine` junction was added in `realtyua/main/node_modules` (shared canonical location) and worktree `node_modules` junction remains — remove worktree `node_modules` junction before `worktree_remove` if/when cleaning up. (4) Package-repo tool patches should be reconciled with `form-engine` package (PUB follow-up) so migration does not rely on local uncommitted package edits.
- **Commit SHA:** — (no commit made).