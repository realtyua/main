# EL-8 — Freshness + parity test Jekyll ↔ 11ty

Phase: 5 · Depends: EL-6, EL-7 · Repo: reifua
Branch: `feat/EL-8-freshness-parity` · Worktree: `../worktrees/EL-8-freshness-parity`

Status: `done`

## Goal

Реалізувати автоматизовані тести, що гарантують:
1. **Freshness** — baked HTML фрагменти в reifua (`dist/`) відповідають актуальним конфігам (`src/_data/*.yml`) та рушію (`src/assets/js/form-engine/**`); при зміні конфігу/рушія тест падає, якщо build не оновлено.
2. **Parity** — Jekyll (`realtyua/main`) і Eleventy (`reifua/main`) рендерять ідентичні HTML фрагменти для однакових конфігів (add-property, notify, demo), за винятком site-специфічних полів (endpoint, page data).

## Files

- `test/freshness.test.mjs` — **новий**: порівнює hash конфігу + рушія з hash запеченого фрагмента в `dist/`; фейлить, якщо `npm run build` не запускали після змін
- `test/parity-jekyll-11ty.test.mjs` — **новий**: завантажує baseline з обох репозиторіїв (або генерує on-the-fly в CI), нормалізує (прибирає endpoint, version hash, page data) і порівнює markup
- `_form-engine/tools/verify-render.ps1` — **порт** з Jekyll (або Node-еквівалент) для render-гейту
- `package.json` — скрипти `test:freshness`, `test:parity`

## Steps

1. `session_move` на `reifua/main`, worktree `../worktrees/EL-8-freshness-parity`, гілка `feat/EL-8-freshness-parity`, junction `node_modules`
2. Baseline: `npm test`, `npm run validate`, `npm run build` до змін
3. Створити `test/freshness.test.mjs`:
   - Обчислити hash конфігів (`src/_data/*.yml`) + engine files (`src/assets/js/form-engine/**`)
   - Обчислити hash baked fragments в `dist/` (витягнути з HTML сторінок)
   - Assert: hashes match (значить build актуальний)
4. Створити `test/parity-jekyll-11ty.test.mjs`:
   - Прочитати `realtyua/main/_form-engine/baseline/*.html` (або згенерувати локально)
   - Прочитати `reifua/main/dist/*/index.html` fragments
   - Нормалізувати: прибрати `data-endpoint`, `?v=<hash>`, `notify-page` data, EOL
   - Assert: markup identical (DeepDiff або string equality)
5. Портнути `verify-render.ps1` → Node script (для крос-платформовості) або оставити PS якщо тільки Windows CI
6. Додати npm скрипти
7. Гейти item

## Acceptance

- `npm run test:freshness` — пасає після `npm run build`, фейлить, якщо конфіг змінено а build ні
- `npm run test:parity` — пасає (add-property, notify, demo markup ідентичні modulo site data)
- Обидва тести інтегровані в `npm test` (або окремний gate)
- Jekyll baseline не змінено (тільки читається)

## Gates

`T` (reifua `npm test` включає freshness + parity), `V`, `B`.

```powershell
npm test
npm run validate
npm run build
```

## Out of scope

- Повний build + усі гейти — EL-9.
- Публікація пакета — Phase 6.

## Handoff log

- **2026-11-12** — status: `review` (gates green, ready for commit)
  - **Files created:**
    - `test/freshness.test.mjs` — re-bakes adapter fragments in-memory, minifies with production transform, compares byte-for-byte with `dist/` fragments (add-property, demo, notify islands)
    - `test/parity-jekyll-11ty.test.mjs` — bakes both stacks from **same config** (Jekyll's `_data/*.yml` as shared input); normalizes endpoint, `?v=`, page data, EOL; compares add-property, demo, notify config island. Skips with clear message if Jekyll repo not found (`FORM_ENGINE_JEKYLL_ROOT`).
    - `_form-engine/tools/verify-render.mjs` — Node equivalent of Jekyll `verify-render.ps1`; exports extraction/canonicalization/CLI helpers used by the freshness test.
  - **Files modified:**
    - `package.json` — added `test:freshness`, `test:parity`, `verify:render` scripts
  - **Gates run (all PASS):**
    - `npm test` — 245/245 (includes freshness + parity)
    - `npm run validate` — add-property.yml valid
    - `npm run build` — 24 files written, dist/ refreshed
    - `npm run test:freshness` — 1/1 (all 42 fragment checks fresh)
    - `npm run test:parity` — 3/3 (add-property, demo, notify config island parity)
    - `npm run verify:render` — 42/42 checks fresh
    - `npm run check:add-property` — PASS (200+ checks)
    - `npm run check:notify` — ok (10 pages checked)
  - **Leftovers:** none (tmp-compare.mjs removed)
  - **Worktree:** `X:\OpenCodeData\opencode\worktree\b25e23\EL-8-freshness-parity` (actual tool-created path; registry listed `../worktrees/EL-8-freshness-parity`)
  - **Commit SHA:** `c2ab420` (merged via `db8ff5e` into `feature/form-engine`)

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->