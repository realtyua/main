# EL-8 — Freshness + parity test Jekyll ↔ 11ty

Phase: 5 · Depends: EL-6, EL-7 · Repo: reifua
Branch: `feat/EL-8-freshness-parity` · Worktree: `../worktrees/EL-8-freshness-parity`

Status: `todo`

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

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->