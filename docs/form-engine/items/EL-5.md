# EL-5 — Passthrough + Tailwind purge

Phase: 5 · Depends: EL-2, EL-4 · Repo: reifua
Branch: `feat/EL-5-passthrough-purge` · Worktree: `../worktrees/EL-5-passthrough-purge`

Status: `done`

## Goal

Налаштувати Eleventy passthrough для всіх статичних асетів Form Engine (Leaflet images, vendor CSS/JS) і увімкнути Tailwind purge для production build, щоб `main.css` містив лише використані утиліті.

## Files

- `.eleventy.js` — `addPassthroughCopy` для:
  - `src/assets/css/images/**/*` (Leaflet marker sprites)
  - `src/assets/vendor/leaflet.css`, `src/assets/vendor/leaflet.js` (якщо не інлайняться)
  - `src/assets/js/form-engine/**/*` (runtime ES modules)
- `tailwind.config.js` — `content` масив з шляхами до:
  - `src/**/*.njk` (templates)
  - `src/_includes/**/*.njk` (partials/layouts)
  - `src/assets/js/form-engine/**/*.js` (runtime, які генерують HTML через JS)
  - `test/**/*.mjs` (тести, що рендерять форми)
- `src/assets/css/main.css` — перевірити `@tailwind base/components/utilities` порядок
- `package.json` — скрипт `build` вже має `NODE_ENV=production`; переконатися, що purge спрацьовує

## Steps

1. `session_move` на `reifua/main`, worktree `../worktrees/EL-5-passthrough-purge`, гілка `feat/EL-5-passthrough-purge`, junction `node_modules`
2. Baseline: `npm test`, `npm run validate`, `npm run build` до змін
3. Додати passthrough у `.eleventy.js` для Leaflet images та vendor асетів (якщо відсутні)
4. Оновити `tailwind.config.js` `content` — додати шляхи до Form Engine runtime та templates
5. Запустити `npm run build`; перевірити `dist/assets/css/main.css`:
   - Розмір зменшився порівняно з dev build
   - Немає невикористовуваних класів (напр., `grid-cols-12` якщо не використовується)
   - Класів з baked HTML форм (`is-invalid`, `dropdown-item`, `step-number` тощо) — присутні
6. Перевірити `dist/assets/css/images/` — Leaflet PNG скопійовані
7. Гейти item

## Acceptance

- `npm run build` зелений
- `dist/assets/css/main.css` — production size (після purge значно менший за dev)
- `dist/assets/css/images/marker-icon.png`, `marker-shadow.png`, `layers.png` існують
- `dist/assets/vendor/bootstrap4.css` — скопійований (з EL-2)
- `dist/assets/js/form-engine/` — вся структура runtime скопійована
- Форми (`/new/`, `/demo/`, notify modal) візуально не зламані (CSS класів вистачає)
- Тести reifua зелені

## Gates

`T` (reifua `npm test`), `V` (`npm run validate`), `B` (`npm run build`).

```powershell
npm test
npm run validate
npm run build
```

## Out of scope

- Порт `check-add-property` — EL-6.
- Порт `check-notify` — EL-7.
- Freshness + parity-тест Jekyll ↔ 11ty — EL-8.
- Зміни рушія, схеми, валідатора.

## Handoff log

**2026-11-09** — status: `review`
- **Files changed**: `tailwind.config.js` (extended `purge.content` with `src/assets/js/form-engine/**/*.js` and `test/**/*.mjs`)
- **Gates run**: `T` 239/239 ✅, `V` ✅, `B` ✅
- **Leftovers**: none (`.eleventy.js` already had all required passthrough copies)
- **Commit SHA**: pending (user will commit after review)

**Summary**: Tailwind purge now scans the Form Engine runtime JS and test files, so all utility classes generated at runtime are preserved. Production `main.css` is ~28 KB (vs ~3.4 MB dev), Leaflet images, Bootstrap 4 CSS, and full form-engine runtime are copied to `dist/`. All 239 tests pass.