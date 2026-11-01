# OC-2 — Skill `form-engine`

Phase: 1 · Depends: OC-1 · Repo: realtyua
Branch: `feature/form-engine` · Worktree: —

Status: `review` (чекає commit BASE-2)

## Goal

Скіл, який дає агенту точний контракт рушія, обох адаптерів, тем і гейтів — без
перечитування 384 рядків `_form-engine/README.md` щоразу.

## Files

- `.opencode/skills/form-engine/SKILL.md`
- `.opencode/skills/form-engine/references/contract.md`
- `.opencode/skills/form-engine/references/jekyll-adapter.md`
- `.opencode/skills/form-engine/references/eleventy-adapter.md`
- `.opencode/skills/form-engine/references/gates.md`
- `.opencode/skills/form-engine/references/theming.md`
- `.opencode/skills/form-engine/scripts/test.ps1`
- `.opencode/skills/form-engine/scripts/validate-all.ps1`
- `.opencode/skills/form-engine/scripts/parity.ps1`

## Steps

1. `SKILL.md`: workflow, шари, заборони, таблиця «куди дивитися».
2. `contract.md`: каркас, геометрія steps→rows→cols→fields, condition DSL,
   submit/behavior, 7 відомих вад v1, bake-маркер.
3. `jekyll-adapter.md`: post_read hook, include opt-in, site-opts, notify-окремий
   випадок, generated vs source, дефекти JEK-R1..R6.
4. `eleventy-adapter.md`: beforeBuild, shortcode, відмінності, passthrough,
   Tailwind purge, поточний стан.
5. `gates.md`: T/V/CA/CN/VR/B/P, очікування, поточні 14 failures, «не
   послаблювати нормалізатор».
6. `theming.md`: інтерфейс теми, інваріанти, glue hooks, SAFELIST, додавання
   віджета.
7. Скрипти: тести, валідація всіх конфігів, хеш-паритет рушія.

## Acceptance

- Скіл видно в переліку доступних (`form-engine`).
- Скрипти запускаються з кореня репо і з worktree.
- `parity.ps1` ловить відомий 1 diff у `themes/tailwind.js`.
- Жодних вигаданих команд/шляхів.

## Gates

```powershell
powershell -File .opencode/skills/form-engine/scripts/validate-all.ps1
powershell -File .opencode/skills/form-engine/scripts/parity.ps1
```

## Out of scope

Автоматичний CI, нові tool-и, зміни рушія.

## Handoff log

- 2026-11-01: скіл створено, зареєстровано OpenCode.
- `validate-all.ps1`: 3/3 конфіги valid (add-property, notify, demo).
- `parity.ps1`: 1 DIFF — `themes/tailwind.js` (відомий косметичний
  `cursor-pointer`, ціль EL-1). Скрипт коректно повертає exit 1.
- `test.ps1` не запускався в цьому item-і; повний прогін — BASE/JEK-R7.
