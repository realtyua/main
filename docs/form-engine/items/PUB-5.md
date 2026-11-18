# PUB-5 — `tools/`, `schema/`, `test/`

Phase: 6 · Depends: PUB-2 · Repo: form-engine
Branch: `feat/PUB-5-tools-schema-test` · Worktree: `../worktrees/PUB-5-tools-schema-test`

Status: `done`

## Goal

Скопіювати platform-agnostic інструменти (`tools/`), схему конфігурації (`schema/`) та тести runtime (`test/`) з `realtyua/main` у корінь репозиторію `form-engine/`. Ці артефакти — частина публічного пакету, вони не прив'язані до Jekyll чи 11ty адаптерів.

## Files

### Source (realtyua/main)
- `_form-engine/tools/validate-config.mjs`
- `_form-engine/tools/yaml.mjs`
- `_form-engine/tools/check-add-property.mjs`
- `_form-engine/tools/check-notify.mjs`
- `_form-engine/schema/form-config.schema.json`
- `test/*.test.mjs` (17 файлів)

### Target (form-engine/)
- `tools/validate-config.mjs`
- `tools/yaml.mjs`
- `tools/check-add-property.mjs`
- `tools/check-notify.mjs`
- `schema/form-config.schema.json`
- `test/*.test.mjs` (17 файлів)

## Steps

1. Створити worktree для PUB-5 в `../worktrees/PUB-5-tools-schema-test` з гілки `master` репозиторію `form-engine`
2. Перейти на гілку `feat/PUB-5-tools-schema-test` в worktree
3. Створити junction на `node_modules` з canonical репозиторію `realtyua/main`
4. Створити директорії `form-engine/tools/`, `form-engine/schema/`, `form-engine/test/`
5. Скопіювати platform-agnostic інструменти з `realtyua/main/_form-engine/tools/` → `form-engine/tools/`:
   - `validate-config.mjs`
   - `yaml.mjs`
   - `check-add-property.mjs`
   - `check-notify.mjs`
   - **НЕ копіювати**: `site-opts.mjs`, `gen-form-app.mjs`, `verify-render.mjs`, `verify-render.ps1` (ці Jekyll-специфічні, вже в `adapters/jekyll/tools/`)
6. Скопіювати схему з `realtyua/main/_form-engine/schema/form-config.schema.json` → `form-engine/schema/form-config.schema.json`
7. Скопіювати всі тести з `realtyua/main/test/` → `form-engine/test/`
8. Видалити `.gitkeep` з цих директорій (файли тепер існують)
9. Запустити baseline gates в `realtyua/main` щоб переконатися, що джерело не поламали
10. Зробити коміт
11. Оновити WORKITEMS.md

## Acceptance

- Всі platform-agnostic інструменти скопійовані в `form-engine/tools/` (4 файли)
- Схема скопійована в `form-engine/schema/form-config.schema.json`
- Всі 17 тестів скопійовані в `form-engine/test/`
- Jekyll-специфічні інструменти НЕ скопійовані (лишаються в `adapters/jekyll/tools/`)
- Структура відповідає плану Phase 6 (розділ 6.2 плану)
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

- Jekyll-адаптер — PUB-3 (готово)
- Eleventy-адаптер — PUB-4 (готово)
- `package.json` exports, versioning — PUB-6
- Examples — PUB-7
- README, docs — PUB-8, PUB-9
- CI, release — PUB-10

## Handoff log

- **2026-11-12**: status `review` — platform-agnostic tools, schema, and tests extracted from `realtyua/main` to `form-engine/` root (4 tools + 1 schema + 17 tests = 22 files). Worktree created at `../worktrees/PUB-5-tools-schema-test`, branch `feat/PUB-5-tools-schema-test`. Junction to canonical `node_modules` created and removed. Gates run in `realtyua/main`: `npm test` (228/228 pass), `validate-config --strict` (3/3 configs valid), `check-add-property` (PASS), `check-notify` (PASS), `verify-render verify` (3/3 files byte-identical to baseline). All copied files verified byte-identical to source. No leftovers. WORKITEMS.md updated with Branch/Worktree/Status.
- **2026-11-12**: status `done` — committed as `d1b8187` in form-engine repo, merged `--no-ff` into `master` as merge commit `664984a`. Branch `feat/PUB-5-tools-schema-test` and worktree removed. PUB-6 (package.json, exports, versioning) now `ready`.