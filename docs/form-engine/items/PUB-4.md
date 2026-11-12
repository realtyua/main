# PUB-4 — Виділити Eleventy-адаптер

Phase: 6 · Depends: PUB-2 · Repo: form-engine
Branch: `feat/PUB-4-extract-eleventy-adapter` · Worktree: `../worktrees/PUB-4-extract-eleventy-adapter`

Status: `review`

## Goal

Скопіювати Eleventy-адаптер Form Engine з `reifua/main` у репозиторій `form-engine/adapters/eleventy/`. Адаптер має містити 11ty plugin (`lib/form-engine.js`) та інструменти збірки (`_form-engine/tools/*`), які знають про 11ty-специфіку (Nunjucks shortcode `{% formApp %}`, вбудовування Leaflet assets, `dist/` структуру, JSON islands для notify).

## Files

- Джерело: `reifua/main/lib/form-engine.js`
- Джерело: `reifua/main/_form-engine/tools/*.mjs` (усі 6 файлів)
- Ціль: `form-engine/adapters/eleventy/lib/form-engine.js`
- Ціль: `form-engine/adapters/eleventy/tools/*.mjs`

## Steps

1. Створити worktree для PUB-4 в `../worktrees/PUB-4-extract-eleventy-adapter` з гілки `master` репозиторію `form-engine`
2. Перейти на гілку `feat/PUB-4-extract-eleventy-adapter` в worktree
3. Створити junction на `node_modules` з canonical репозиторію `reifua/main`
4. Скопіювати `lib/form-engine.js` → `form-engine/adapters/eleventy/lib/form-engine.js`
5. Скопіювати всі файли з `_form-engine/tools/` → `form-engine/adapters/eleventy/tools/`
6. Переконатися, що структура відповідає плану:
   - `adapters/eleventy/lib/form-engine.js`
   - `adapters/eleventy/tools/check-add-property.mjs`
   - `adapters/eleventy/tools/check-notify.mjs`
   - `adapters/eleventy/tools/validate-config.mjs`
   - `adapters/eleventy/tools/yaml.mjs`
   - `adapters/eleventy/tools/verify-render.mjs`
   - `adapters/eleventy/tools/engine-manifest.mjs`
7. Видалити `.gitkeep` з цих директорій (файли тепер існують)
8. Запустити baseline gates в `reifua/main` щоб переконатися, що джерело не поламали
9. Зробити коміт
10. Оновити WORKITEMS.md

## Acceptance

- Всі Eleventy-адаптер файли скопійовані в `form-engine/adapters/eleventy/`
- Структура відповідає плану Phase 6
- Жоден файл не змінений (тільки копія)
- `.gitkeep` видалені з директорій, де тепер є файли
- Gates проходять в `reifua/main`

## Gates

T (npm test в reifua/main для перевірки, що джерело не поламали)
V (validate-config --strict для 3 конфігів)
CA (check-add-property)
CN (check-notify)
VR (verify-render verify)
B (engine:manifest - хеш рушія)

## Out of scope

- Jekyll-адаптер — PUB-3 (готово)
- Root-level `tools/`, `schema/`, `test/` — PUB-5
- `package.json` exports, versioning — PUB-6
- Examples — PUB-7
- README, docs — PUB-8, PUB-9
- CI, release — PUB-10

## Handoff log

- **2026-11-12**: status `review` — Eleventy adapter extracted from `reifua/main` to `form-engine/adapters/eleventy/` (7 files: 1 plugin + 6 tools). Worktree created at `../worktrees/PUB-4-extract-eleventy-adapter`, branch `feat/PUB-4-extract-eleventy-adapter`. Junction to canonical `node_modules` created and removed. Gates run in `realtyua/main`: `npm test` (228/228 pass), `validate-config --strict` (3/3 configs valid), `check-add-property` (PASS), `check-notify` (PASS), `verify-render verify` (3/3 files byte-identical to baseline). All copied files verified byte-identical to source via SHA256. No leftovers. WORKITEMS.md updated with Branch/Worktree/Status.