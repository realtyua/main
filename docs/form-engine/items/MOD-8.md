# MOD-8 — Свідоме перезахоплення baseline `verify-render`

Phase: 8 · Depends: MOD-6, MOD-7 · Repo: realtyua

Branch: `feat/MOD-8-baseline-recapture` · Worktree: `../worktrees/MOD-8-baseline-recapture`

Status: `todo`

> Окрема сесія. Основний акт — **перегляд кожної розбіжності**, а не «зелений
> гейт будь-якою ціною». Заборонено послаблювати нормалізатор і «лікувати»
> baseline.

## Goal

Після MERGE-2, MOD-6 і MOD-8 знімок `_form-engine/baseline/` знову відповідає
поточному рендеру, а кожна зміна в ньому усвідомлено задокументована.

## Поточний стан (на 2026-11-18)

`verify-render.ps1 verify` — FAIL 2/3; baseline захоплено 2026-11-08:

1. `new.html` — тільки `form-bake name=add-property sha`:
   `0651f32a…` → `08e2d3c7…`. Причина: PUB-18 rebake `e301affb`
   (2026-11-18). Користувацький коміт `fd4978c6` (`_data/add-property.yml`)
   може змінити SHA ще раз — перевірити свіжий diff.
2. NEW POST у трекованій property-сторінці:
   `district/town/kosiv/apartment/prodam-1789988154.html` →
   `region/city/yaremche/house/prodam-budynok-1794757537.html` (новий пост
   із `master`).

Обидві розбіжності — застарілий еталон, не регресія злиття.

## Files

- `_form-engine/baseline/.render-baseline.json` (`capturedAt`, tracked post)
- `_form-engine/baseline/new.html.txt`
- решта файлів `_form-engine/baseline/` — лише за реальною потребою

## Steps

1. Достроково не запускати `capture`: спершу дочекатися MERGE MOD-6 і MOD-7 —
   обидва можуть вплинути на рендер `head.html`.
2. Прогнати `verify`, зберегти повний diff для кожного з 3 трекованих файлів.
3. Переглянути кожен diff in-place, записати причину в handoff.
4. За наявності неочікуваних змін — зупинитися й уточнити в користувача, а не
   перезахоплювати.
5. `verify-render.ps1 capture`, потім повторний `verify` — має бути 3/3.
6. Оновити metadata (`capturedAt`) і реєстр; handoff; локальний цикл після
   «прийнято».

## Acceptance

- [ ] Кожна розбіжність переглянута й має письмове пояснення в handoff
- [ ] Немає змін у normalisator/гейтах, зроблених заради green
- [ ] `verify` після `capture` — 3/3
- [ ] У реєстрі/`MERGE-2.md` зафіксовано дату перезахоплення

## Gates

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
node _form-engine/tools/check-notify.mjs
powershell -File _form-engine/tools/verify-render.ps1 verify
```

`B` виконується всередині `verify-render` (~175 с).

## Out of scope

- Зміни в конфігах форм, темі, runtime, `head.html` (MOD-6/MOD-7)
- Прибирання статусу MERGE-2 (він `done`)
- push

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
