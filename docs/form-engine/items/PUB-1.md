# PUB-1 — Bootstrap репо + MIT `LICENSE` + `NOTICE`

Phase: 6 · Depends: EL-9 · Repo: form-engine
Branch: `feat/PUB-1-bootstrap-repo` · Worktree: `../worktrees/PUB-1-bootstrap-repo`

Status: `review`

## Goal

Створити новий репозиторій `form-engine` з початковою структурою, MIT ліцензією та NOTICE файлом. Репозиторій має бути готовим до прийняття коду з `realtyua/main` (Jekyll-адаптер + runtime) та `reifua/main` (11ty-адаптер + runtime).

## Files

- `LICENSE` — MIT licence text
- `NOTICE` — attribution notices (MIT requires preserving copyright/license notices)
- `README.md` — placeholder (initial)
- `.gitignore` — for Node.js project
- `package.json` — minimal with name, version 0.0.0, private: true (pre-publish)
- `.github/workflows/ci.yml` — placeholder workflow
- Directory structure scaffold:
  - `runtime/` (empty, `.gitkeep`)
  - `runtime/themes/` (empty, `.gitkeep`)
  - `adapters/jekyll/_plugins/` (empty, `.gitkeep`)
  - `adapters/jekyll/tools/` (empty, `.gitkeep`)
  - `adapters/eleventy/lib/` (empty, `.gitkeep`)
  - `tools/` (empty, `.gitkeep`)
  - `schema/` (empty, `.gitkeep`)
  - `test/` (empty, `.gitkeep`)
  - `examples/jekyll/` (empty, `.gitkeep`)
  - `examples/eleventy/` (empty, `.gitkeep`)

## Steps

1. Створити директорію `../form-engine` (поруч з `realtyua` і `reifua`)
2. `git init`
3. Створити файли зі структури вище
4. `git add . && git commit -m "PUB-1: bootstrap repo with MIT LICENSE and NOTICE"`
5. Створити гілку `feat/PUB-1-bootstrap-repo` (або працювати в `main` і потім гілка для наступних items)
6. Оновити `WORKITEMS.md` — встановити Branch/Worktree/Status

## Acceptance

- Репозиторій `form-engine` існує локально з правильною структурою
- `LICENSE` — MIT текст (SPDX: MIT)
- `NOTICE` — містить copyright notice для Form Engine
- `package.json` — валідний, `name: "form-engine"`, `private: true`
- `.gitignore` — ігнорує `node_modules`, `dist`, `.env`, `*.log`
- Всі scaffold-директорії існують з `.gitkeep`
- Початковий коміт зроблений локально

## Gates

- `git status` — clean
- `cat LICENSE` — MIT text
- `cat NOTICE` — attribution present
- `npm pack --dry-run` — не фейлить (валідує package.json)

## Out of scope

- Публікація на GitHub/npm — PUB-10
- Перенесення runtime/adapters/tools — PUB-2..PUB-5
- Examples, README content, CI — PUB-6..PUB-9

## Handoff log

- **2026-11-12**: status `review` — form-engine repo created at `C:\Users\Vasyl\Documents\GitHub\form-engine` with scaffold structure, MIT LICENSE, NOTICE, README.md, .gitignore, package.json, .github/workflows/ci.yml. All 10 scaffold directories with .gitkeep. Initial commit `23d9489` in form-engine repo. Gates: `git status` clean, `cat LICENSE` — MIT text, `cat NOTICE` — attribution present, `npm pack --dry-run` — PASS. No leftovers. WORKITEMS.md updated with Branch/Worktree/Status/Commit.
- **2026-11-12**: updated `package.json` repository URL to `https://github.com/realtyua/form-engine.git` (Option A). New commit `1b15b19`. Gates re-verified: `npm pack --dry-run` — PASS.