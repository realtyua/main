# PUB-3 — Виділити Jekyll-адаптер

Phase: 6 · Depends: PUB-2 · Repo: form-engine
Branch: `feat/PUB-3-extract-jekyll-adapter` · Worktree: `../worktrees/PUB-3-extract-jekyll-adapter`

Status: `done`

## Goal

Скопіювати Jekyll-адаптер Form Engine з `realtyua/main` у новий репозиторій `form-engine/adapters/jekyll/`. Адаптер має містити Jekyll plugin (`_plugins/form_engine.rb`) та інструменти збірки (`_form-engine/tools/*`), які знають про Jekyll-специфіку (читання `_config.yml`, `_data/uk.yml`, Liquid-to-HTML baking).

## Files

- Джерело: `realtyua/main/_plugins/form_engine.rb`
- Джерело: `realtyua/main/_form-engine/tools/*.mjs` (всі 7 файлів)
- Джерело: `realtyua/main/_form-engine/tools/verify-render.ps1`
- Ціль: `form-engine/adapters/jekyll/_plugins/form_engine.rb`
- Ціль: `form-engine/adapters/jekyll/tools/*.mjs`
- Ціль: `form-engine/adapters/jekyll/tools/verify-render.ps1`

## Steps

1. Створити worktree для PUB-3 в `../worktrees/PUB-3-extract-jekyll-adapter` з гілки `master` репозиторію `form-engine`
2. Перейти на гілку `feat/PUB-3-extract-jekyll-adapter` в worktree
3. Створити junction на `node_modules` з canonical репозиторію `realtyua/main`
4. Скопіювати `_plugins/form_engine.rb` → `form-engine/adapters/jekyll/_plugins/form_engine.rb`
5. Скопіювати всі файли з `_form-engine/tools/` → `form-engine/adapters/jekyll/tools/`
6. Переконатися, що структура відповідає плану:
   - `adapters/jekyll/_plugins/form_engine.rb`
   - `adapters/jekyll/tools/gen-form-app.mjs`
   - `adapters/jekyll/tools/validate-config.mjs`
   - `adapters/jekyll/tools/yaml.mjs`
   - `adapters/jekyll/tools/site-opts.mjs`
   - `adapters/jekyll/tools/check-add-property.mjs`
   - `adapters/jekyll/tools/check-notify.mjs`
   - `adapters/jekyll/tools/verify-render.mjs`
   - `adapters/jekyll/tools/verify-render.ps1`
7. Видалити `.gitkeep` з цих директорій (файли тепер існують)
8. Запустити baseline gates в `realtyua/main` щоб переконатися, що джерело не поламали
9. Зробити коміт
10. Оновити WORKITEMS.md

## Acceptance

- Всі Jekyll-адаптер файли скопійовані в `form-engine/adapters/jekyll/`
- Структура відповідає плану Phase 6
- Жоден файл не змінений (тільки копія)
- `.gitkeep` видалені з директорій, де тепер є файли
- Gates проходять в `realtyua/main`

## Gates

T (npm test в realtyua/main для перевірки, що джерело не поламали)
V (validate-config --strict для 3 конфігів)
CA (check-add-property)
CN (check-notify)
VR (verify-render verify)

## Out of scope

- Eleventy-адаптер — PUB-4
- Root-level `tools/`, `schema/`, `test/` — PUB-5
- `package.json` exports, versioning — PUB-6
- Examples — PUB-7
- README, docs — PUB-8, PUB-9
- CI, release — PUB-10

## Handoff log

- **2026-11-12**: status `review` — Jekyll adapter extracted from `realtyua/main` to `form-engine/adapters/jekyll/` (9 files: 1 plugin + 8 tools). Worktree created at `../worktrees/PUB-3-extract-jekyll-adapter`, branch `feat/PUB-3-extract-jekyll-adapter`. Junction to canonical `node_modules` created and removed. Gates run in `realtyua/main`: `npm test` (228/228 pass), `validate-config --strict` (3/3 configs valid), `check-add-property` (PASS), `check-notify` (PASS), `verify-render verify` (3/3 files byte-identical to baseline). All copied files verified byte-identical to source via SHA256. No leftovers. WORKITEMS.md updated with Branch/Worktree/Status.
- **2026-11-12**: status `done` — committed as `35e80dd` in form-engine repo, merged `--no-ff` into `master` as merge commit `eaa641b`. Branch `feat/PUB-3-extract-jekyll-adapter` and worktree can be removed. PUB-4 (Eleventy adapter) now `ready`.