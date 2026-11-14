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

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->