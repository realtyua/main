# EL-7 — Порт `check-notify`

Phase: 5 · Depends: EL-4 · Repo: reifua
Branch: `feat/EL-7-check-notify` · Worktree: `../worktrees/EL-7-check-notify`

Status: `todo`

## Goal

Портити Jekyll-інструмент `_form-engine/tools/check-notify.mjs` у reifua. Інструмент валідує notify-фрагмент:
- присутність обов'язкових полів (honeypot, timestamp, uid, property_url, property_email, property_title, reason, details, captcha)
- коректність endpoint
- відсутність Alpine-атрибутів
- відповідність baseline `_form-engine/baseline/notify.html`

## Files

- `_form-engine/tools/check-notify.mjs` — **новий/порт** з Jekyll
- `_form-engine/baseline/notify.html` — **новий** baseline (створити з поточного виводу reifua після EL-4)
- `package.json` — скрипт `check:notify` → `node _form-engine/tools/check-notify.mjs`

## Steps

1. `session_move` на `reifua/main`, worktree `../worktrees/EL-7-check-notify`, гілка `feat/EL-7-check-notify`, junction `node_modules`
2. Baseline: `npm test`, `npm run validate`, `npm run build` до змін
3. Портнути Jekyll `check-notify.mjs` → reifua (шляхи, baked fragment extraction)
4. Згенерувати baseline: збудувати сторінку оголошення (або тестову), витягнути notify modal HTML, зберегти в `_form-engine/baseline/notify.html`
5. Додати npm script `check:notify`
6. Запустити — має пройти (0 failures) або показати відомі drift-и, якщо є
7. Гейти item

## Acceptance

- `_form-engine/tools/check-notify.mjs` запускається і перевіряє notify fragment
- `_form-engine/baseline/notify.html` існує і відповідає поточному reifua виводу
- `npm run check:notify` працює
- Тести reifua зелені

## Gates

`T` (reifua `npm test`), `V` (`npm run validate`), `B` (`npm run build`), `CN` (`npm run check:notify`).

```powershell
npm test
npm run validate
npm run build
npm run check:notify
```

## Out of scope

- Freshness + parity-тест Jekyll ↔ 11ty — EL-8.
- Виправлення drift (окремі item-и).

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->