# OC-3 — Реєстр, шаблон item, `/item`

Phase: 1 · Depends: OC-2 · Repo: realtyua
Branch: `feature/form-engine` · Worktree: —

Status: `done` (коміт `178afaf8`, гілка `feature/form-engine`)

## Goal

Кожен наступний крок можна почати окремою сесією: є реєстр 41 item, шаблон
детального item-файлу і команда `/item <ID>`.

## Files

- `docs/form-engine/WORKITEMS.md`
- `docs/form-engine/README.md`
- `docs/form-engine/items/_TEMPLATE.md`
- `docs/form-engine/items/OC-1.md` … `OC-5.md`
- `.opencode/commands/item.md`

## Steps

1. Таблиці по фазах: ID, Title, Depends, Status, Branch, Worktree, Last session,
   Commit. Разом 41.
2. Статуси й правила переходів (`todo → ready → doing → review → done`,
   `blocked`).
3. Шаблон: Goal, Files, Steps, Acceptance, Gates, Out of scope, Handoff log.
4. Команда `/item` з `$1`: перевірка repo/branch/worktree, baseline-гейти,
   scope, гейти, handoff, статус, коміт.
5. `README.md` з поясненням процесу.

## Acceptance

- `/item OC-1` розпізнається OpenCode.
- У реєстрі рівно 41 ID, усі з плану.
- Залежності узгоджені з планом.
- Порожній/невідомий `$1` → список ID і стоп.

## Gates

Візуальна звірка з планом (розділ 5) + запуск `/item` без аргументу.

## Out of scope

Створення решти 36 item-файлів — вони з'являться на старті відповідного item-а.

## Handoff log

- 2026-11-01: реєстр створено (5+5+7+5+9+10 = 41).
- Phase 1 items одразу в `review`, бо коміт ще не зроблено (BASE-2).
- OC-5 у реєстрі позначено `review` після правки `.gitignore`.
