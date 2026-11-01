# OC-4 — `AGENTS.md`

Phase: 1 · Depends: OC-1 · Repo: realtyua
Branch: `feature/form-engine` · Worktree: —

Status: `review` (чекає commit BASE-2)

## Goal

Постійні інструкції агента: архітектура, конвеєр, що не можна редагувати,
заборони, гейти, work item протокол, конвенції комітів.

## Files

- `AGENTS.md`

## Steps

1. Призначення та дві платформи.
2. Структура каталогів.
3. Конвеєр bake.
4. «Ніколи не редагувати»: generated, `assets/data/form-*.json`, `_site`,
   baseline.
5. Заборони: site-специфіка в конфігу, Alpine, лікування baseline,
   послаблення нормалізатора, зміна theme заради тесту.
6. Гейти + поточний стан (214 тестів, 3/3 valid, 14 failures).
7. Work items: один item = сесія = гілка = worktree.
8. Коміти: `<ID>: ...`, `chore(opencode): ...`, `feat(form-engine): ...`.
9. Посилання на 11ty-двійник і reference `plan`.

## Acceptance

- `AGENTS.md` підхоплюється як інструкції (видно в контексті).
- Немає дублювання деталей, які вже в скілі — лише покажчики.
- Усі команди реальні.

## Gates

Завантаження OpenCode (інструкції з'являються в контексті).

## Out of scope

Локальні правила для `reifua` (окремий `AGENTS.md` у Phase 5 за потреби).

## Handoff log

- 2026-11-01: створено. OpenCode підхопив одразу після запису (system-update
  «Instructions from … AGENTS.md»).
