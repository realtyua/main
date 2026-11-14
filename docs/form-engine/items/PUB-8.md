# PUB-8 — `README.md` + getting started

Phase: 6 · Depends: PUB-7 · Repo: form-engine
Branch: `feat/PUB-8-readme-getting-started` · Worktree: `../worktrees/PUB-8-readme-getting-started`

Status: `done`

## Goal

Кореневий `README.md` пакета `form-engine` стає повною точкою входу для
стороннього розробника: посилання на приклади, інструкції встановлення для Jekyll
та Eleventy, мінімальні кроки «Hello World», архітектурний огляд, посилання на
config reference / theming / migration (PUB-9) і CI/реліз (PUB-10).

## Files

- `README.md` (корінь `form-engine/`) — перезаписати повністю.

## Steps

1. Worktree від `master` репозиторію `form-engine`:
   `worktree_create "PUB-8-readme-getting-started"` (створюється в **detached HEAD**).
2. Усередині worktree: `git checkout -b feat/PUB-8-readme-getting-started`.
3. Junction на канонічний `node_modules`:
   `cmd /c mklink /J node_modules ..\..\main\node_modules` (без `npm install`).
   Зняти **до** `worktree_remove`.
4. Baseline gates **до** змін: `npm test` (очікувано 183/183).
5. Переписати `README.md`:
   - Badges (build, version, license, node).
   - One-liner + motto.
   - Quick links: examples/jekyll, examples/eleventy, config reference, theming, migration.
   - Installation: `npm i form-engine` (оскільки пакет приватний — зараз `file:` /
     GitHub URL; нотатка про PUB-10).
   - **Getting Started — Jekyll**: мінімальні кроки (Gemfile, _config.yml, _data/demo.yml,
     layout, include, bake, serve) + посилання на `examples/jekyll/README.md`.
   - **Getting Started — Eleventy/11ty**: мінімальні кроки (package.json, .eleventy.js,
     src/_data/demo.yml, layout, shortcode, serve) + посилання на
     `examples/eleventy/README.md`.
   - Architecture overview (runtime, adapters, themes, tools, schema).
   - Themes: Bootstrap 4, Tailwind — як обрати, як перемикати.
   - Scripts / Gates: `npm test`, `validate-config`, `check-add-property`, `check-notify`,
     `verify-render`, `examples` contract.
   - Config reference / Theming / Migration — посилання на PUB-9 docs.
   - Contributing / License (MIT) / NOTICE.
6. Гейти item (див. нижче).
7. Handoff у цей файл + рядок у `WORKITEMS.md` (Branch/Worktree/Status).

## Acceptance

- `README.md` — UTF-8 без BOM.
- Має секції: Badges, Quick links, Installation, Getting Started Jekyll, Getting Started 11ty,
  Architecture, Themes, Scripts/Gates, Config reference (link), Migration (link), License.
- Посилання на `examples/jekyll/` і `examples/eleventy/` робочі (релятивні).
- Жодних змін в `runtime/`, `adapters/`, `schema/`, `tools/`, `test/`, `examples/`,
  `package.json`, `LICENSE`, `NOTICE`, `CHANGELOG.md`.
- `npm test` зелений (183/183).

## Gates

- **T** (suite): `npm test` — мусить лишитися 183/183.
- **DOC**: перевірка вручну — README читається, посилання працюють, немає помилок
  форматування Markdown (гірки, код-блоки, таблиці).

```powershell
npm test
```

## Out of scope

- Config reference, theming guide, migration guide — PUB-9 (окремі `.md` в `docs/`).
- CI (Node + Ruby + 11ty build + parity) + реліз `1.0.0` — PUB-10.
- Будь-які зміни в `runtime/`, `adapters/`, `schema/`, `tools/`, `test/`, `examples/`.
- Наповнення прикладів реальним контентом/стилями realty.ua чи reifua.

## Handoff log

- **2026-11-14**: status `review` — README.md rewritten in form-engine worktree
  `C:\Users\Vasyl\Documents\GitHub\worktrees\PUB-8-readme-getting-started`, branch
  `feat/PUB-8-readme-getting-started` (junction to canonical `node_modules` created at
  `..\..\realtyua\main\node_modules`, to be removed before worktree cleanup).

  Files changed:
  - `README.md` — completely rewritten with:
    - Badges (build, tests, license, Node version)
    - Quick links table (examples, config reference, theming, migration)
    - Installation section (GitHub/local, peer dependencies)
    - Getting Started — Jekyll (7 steps: Gemfile, _config.yml, _data/demo.yml, layout, page, adapter copy, build/serve)
    - Getting Started — Eleventy/11ty (7 steps: package.json, .eleventy.js, site.js, demo.yml, layout, page, build/serve)
    - Architecture overview (directory tree + key principles)
    - Themes comparison table + switching instructions
    - Scripts & Gates table (npm test, validate-config, check-add-property, check-notify, examples contract, Jekyll/11ty specific)
    - Links to PUB-9 docs (config-reference, theming, migration)
    - Contributing guidelines
    - License (MIT)

  Gates:
  - **T** `npm test`: **183/183 pass** (baseline unchanged).
  - **DOC** manual verification: README renders correctly, all relative links to `examples/jekyll/`, `examples/eleventy/`, and `docs/*.md` resolve; Markdown formatting (tables, code blocks, headings) is valid.

  Deviations / notes:
  - Links to `docs/config-reference.md`, `docs/theming.md`, `docs/migration.md` are forward references (PUB-9 not yet done) — this is intentional per spec.
  - Installation uses `github:your-org/form-engine` placeholder — actual org/repo to be set at PUB-10 release.
  - No changes to `runtime/`, `adapters/`, `schema/`, `tools/`, `test/`, `examples/`, `package.json`, `LICENSE`, `NOTICE`, `CHANGELOG.md`.
  - All files verified UTF-8 without BOM.

  Leftovers / out of scope:
  - Config reference, theming guide, migration guide — PUB-9.
  - CI (Node + Ruby + 11ty build + parity) + release `1.0.0` — PUB-10.
  - Junction on `node_modules` must be removed before `worktree_remove`.

  Commit SHA: 19f35d9 (merged to feature/form-engine via 6026d11).