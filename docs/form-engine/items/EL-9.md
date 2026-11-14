# EL-9 — Повний build + усі гейти

Phase: 5 · Depends: EL-1..EL-8 · Repo: reifua
Branch: `feat/EL-9-full-gates` · Worktree: `../worktrees/EL-9-full-gates`

Status: `todo`

## Goal

Запустити повний цикл валідації reifua проекту: всі тести, всі конфіги валідні, production build успішний, всі гейти (T, V, B, CA, CN, VR, P) зелені. Це "definition of done" для Phase 5 перед публікацією (Phase 6).

## Files

- Жодних нових файлів — лише запуск і фикс флаків, якщо є
- Можлива дрібна підправка `package.json` скриптів для зручного `npm run gates:all`

## Steps

1. `session_move` на `reifua/main`, worktree `../worktrees/EL-9-full-gates`, гілка `feat/EL-9-full-gates`, junction `node_modules`
2. Baseline: `npm test`, `npm run validate`, `npm run build` до змін
3. Запустити повний набір гейтів послідовно:
   ```powershell
   npm test                    # T: 218+ тестів
   npm run validate            # V: 3 конфіги (add-property, notify, demo)
   npm run build               # B: production build
   npm run check:add-property  # CA: 14 відомих failures (accepted)
   npm run check:notify        # CN: 0 failures
   npm run test:freshness      # VR: freshness gate
   npm run test:parity         # P: Jekyll ↔ 11ty parity
   ```
4. Якщо якісь гейти червоні — фіксити в межах цього item-а (тільки test/build/config, не scope інших item-ів)
5. Зафіксувати остаточний стан baseline (`_form-engine/baseline/*.html`) якщо змінився
6. Оновити `WORKITEMS.md` — EL-9 `done`
7. Гейти item

## Acceptance

- Всі 7 гейтів проходять (`T`, `V`, `B`, `CA`, `CN`, `VR`, `P`)
- `npm run build` створює `dist/` з усіма сторінками: `/`, `/new/`, `/demo/`, `/about/`, `/contacts/`, notify modal на сторінках оголошень
- Жодних регресій у візуалізації форм (Bootstrap на `/new/`, Tailwind на `/demo/`, modal notify)
- Baseline файли актуальні
- reifua готова до Phase 6 (пакування runtime, адаптерів, публікація)

## Gates

Всі: `T`, `V`, `B`, `CA`, `CN`, `VR`, `P`.

```powershell
npm test
npm run validate
npm run build
npm run check:add-property
npm run check:notify
npm run test:freshness
npm run test:parity
```

## Out of scope

- Phase 6 (PUB-1..PUB-10): окремний репозиторій `form-engine`, MIT LICENSE, NPM publish, CI, docs.

## Handoff log

**Status:** done
**Files changed:** none (only ran gates, no code changes needed)
**Gates run:**
- `npm test` — 245/245 tests PASS (T)
- `npm run validate` — 3/3 configs valid (V)
- `npm run build` — production build successful (B)
- `npm run check:add-property` — PASS, 14 known copy-drift + file-info failures accepted (CA)
- `npm run check:notify` — ok, 10 pages checked (CN)
- `npm run test:freshness` — all 42 fragments fresh (VR)
- `npm run test:parity` — 3/3 parity tests PASS (P)
- `npm run verify:render` — all 42 freshness checks PASS
**Leftovers:** none
**Commit SHA:** (pending user review and merge)