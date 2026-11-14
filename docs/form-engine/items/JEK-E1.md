# JEK-E1 — Аудит Phase 7c: чого бракує theme-neutral hooks

Phase: 4 · Depends: JEK-R7 · Repo: realtyua
Branch: `feat/JEK-E1-theme-hooks-audit` · Worktree: `../worktrees/JEK-E1-theme-hooks-audit`

Status: `review`

## Goal

Зафіксувати повний перевірений перелік DOM-хуків, на які спираються
runtime/glue/CSS/тести, і для кожного вирішити, чи він theme-neutral. Після
item-а є документ-аудит із переліком відсутніх або крихких hooks і рішеннями
для JEK-E2. Код рушія, теми, тести й конфіги в цьому item-і не змінюються.

## Контекст

- `_form-engine/README.md:259` тримає Phase 7c як `pending`:
  «Theme-neutral DOM hooks (drop the tailwind `.form-group` crash)».
- Tailwind-тема вже зберігає частину класових hooks (`custom-file`,
  `custom-file-label`, `dropdown-menu`, `dropdown-item`,
  `valid-feedback`, `invalid-feedback`, `position-relative`, `file-previews`,
  `btn-clear`, `alert`, `alert-info`, `mt-2`) — див. шапку
  `assets/js/form-engine/themes/tailwind.js`.
- `test/render-tailwind.test.mjs` перевіряє id/`data-*`-паритет і частину
  класових hooks, але не повний контракт «кожен селектор glue знаходить
  елемент в обох темах». Повний Bootstrap4-render-паритет — JEK-E3.
- `page-form.js` уже перейшов із `.form-group` на `[data-field-group]`, проте
  лишаються `closest('.position-relative')`, `closest('.custom-file')`,
  `closest('.mt-2')`, `querySelector('.location-search-icon')`,
  `querySelector('.alert-info')` тощо. Частина з них — theme-owned
  презентація, частина — фактичний JS-контракт; аудит має їх розділити.

## Files

- `docs/form-engine/items/JEK-E1.md` — spec + handoff (цей файл).
- `docs/form-engine/theme-neutral-hooks.md` — **новий** документ-аудит:
  інвентар селекторів, матриця «селектор × тема», перелік прогалин,
  рішення для JEK-E2/E3/E4.
- `docs/form-engine/WORKITEMS.md` — рядок JEK-E1.

Читаються, але **не змінюються**:

- `assets/js/form-engine/page-form.js`, `modal-form.js`, `binder.js`,
  `modals.js`, `app.js`, `submit.js`, `captcha.js`;
- `assets/js/form-engine/themes/bootstrap4.js`, `tailwind.js`,
  `bootstrap4.css`, `tailwind.css`;
- `test/render.test.mjs`, `test/render-tailwind.test.mjs`,
  `test/binder.test.mjs`;
- `_form-engine/README.md`, `.opencode/skills/form-engine/references/theming.md`.

## Steps

1. Worktree `JEK-E1-theme-hooks-audit`, гілка
   `feat/JEK-E1-theme-hooks-audit` (detached HEAD → `git checkout -b`).
2. Junction `node_modules` на `../../main/node_modules` (без `npm install`).
3. Baseline-гейти **до** будь-яких правок: `npm test`, три
   `validate-config --strict`, `check-add-property`.
4. Інвентаризувати кожен класовий селектор у runtime/glue (усі
   `querySelector*`, `closest`, `classList.*` з літеральним класом) з
   `file:line` і позначити: `data-*`-hook, класовий контракт, презентація
   теми або Bootstrap-only leak.
5. Відрендерити репрезентативний конфіг (усі типи полів і чотири widgets)
   обома темами в чистому Node; витягти набори id, `data-*` і класів,
   порівняти.
6. Для кожного селектора glue перевірити, чи його емітить кожна тема, чи
   пошук захищений `null`-guard, і які наслідки має відсутність.
7. Записати в аудит рішення по кожній прогалині: лишити класовий hook,
   підняти до `data-*`-hook або віддати селектор темі; окремо позначити, що
   належить JEK-E2 (реалізація), JEK-E3 (Bootstrap4-тести) і JEK-E4
   (доступність).
8. Дописати handoff, оновити рядок у `WORKITEMS.md`.

## Acceptance

- Кожен класовий селектор у `page-form.js`, `modal-form.js`, `binder.js`,
  `modals.js`, `app.js`, `submit.js`, `captcha.js` має запис у таблиці
  інвентарю з `file:line` і категорією.
- Для кожного hook-класу показано, чи він присутній у рендері
  `bootstrap4`, `tailwind`, обох або жодній темі.
- Немає некласифікованих theme-dependent селекторів; кожна прогалина має
  severity (blocker / risk / cosmetic) і конкретну рекомендацію для E2.
- Аудит явно відповідає, чи живий ще «tailwind `.form-group` crash», і якщо
  ні — фіксує це як закритий у Phase 7a/7b факт, а не як відкриту роботу.
- `git status` показує лише три doc-файли item-а.
- **T** лишається 214/214, **V** 3/3, **CA** PASS — код не зачеплено.

## Gates

Плановий гейт item-а — `—` (аудит без зміни коду). Для sanity:

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
```

`VR`, `B`, `P` не запускаються: runtime, теми, `_data`, `_includes`,
`_plugins` і baseline не змінюються.

## Out of scope

- Реалізація theme-neutral hooks — JEK-E2.
- Bootstrap4 render-тести до паритету з Tailwind — JEK-E3.
- Доступність (labels, aria, focus, keyboard) — JEK-E4.
- Повний build + фінальні docs / оновлення статусу Phase 7c у README — JEK-E5.
- Будь-які зміни в `reifua` (11ty) — EL-*.
- Пере-захоплення `_form-engine/baseline/**`.

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-07: Item відновлено з `_TEMPLATE.md` (spec-файл був відсутній);
  spec показано користувачу й затверджено без правок. База — `realtyua/main`,
  гілка `feature/form-engine`, HEAD `bee22b8d`, робоче дерево чисте.
- 2026-11-07: Worktree `../worktrees/JEK-E1-theme-hooks-audit`, гілка
  `feat/JEK-E1-theme-hooks-audit` (detached HEAD → `git checkout -b`).
  Junction `node_modules` → `../../main/node_modules` (без `npm install`).
- 2026-11-07: Baseline-гейти до будь-яких змін:
  - **T** — `npm test`: **214/214 pass**, 0 fail.
  - **V** — 3/3 valid: `add-property`, `notify`, `demo` (`--strict`).
  - **CA** — `check-add-property` **PASS**, 0 failures.
  - **VR**/**B**/**P** не запускалися: runtime, теми, `_data`, `_includes`,
    `_plugins` і baseline не змінюються.
- 2026-11-07: Метод аудиту:
  - статичний інвентар усіх літеральних класових селекторів у
    `app.js`, `binder.js`, `captcha.js`, `modal-form.js`, `modals.js`,
    `page-form.js`, `render.js`, `submit.js`;
  - `FormRender.render` для `add-property`, `notify`, `demo` обома темами —
    порівняно `id`, `data-field`, `data-field-col`, `data-widget`,
    `data-widget-name`;
  - окремо `theme.chrome()` (wizard-chrome не входить у form-render);
  - CSS обох тем і site-SCSS — щоб відрізнити «клас стилізований» від
    «клас просто емітиться».
- 2026-11-07: Результати:
  - `.form-group` crash **закритий у 7a/7b**: жоден runtime-селектор не
    використовує `.form-group`; glue ходить по `[data-field-group]`;
    Tailwind емітить `mb-4`; `render-tailwind.test.mjs:28,113-114` забороняє
    `form-group`. `_form-engine/README.md:259` (`pending`) застарілий → E5.
  - `id`/`data-*`-паритет повний: `add-property` 70 id / 38+38+4+4,
    `notify` 21 / 10+5+0+0, `demo` 70 / 38+38+4+4 — усі набори рівні.
  - 8 прогалин: G-1 (map fallback, Tailwind — реальний UI-дефект, risk);
    G-2 (`bindForm({classes})` не використовується, risk); G-3 (location
    summary через `.mt-2`, risk); G-8 (`.step-indicator`, risk низький);
    G-4/G-5/G-6 (Bootstrap-утиліти в glue-DOM, косметика); G-7
    (`d-none`/`was-validated`/`.modal`/`.hidden` — host-контракт модалки,
    exempt). Blocker-ів немає.
  - Повний аналіз, таблиці та рішення для E2/E3/E4/E5 —
    `docs/form-engine/theme-neutral-hooks.md`.
- 2026-11-07: Змінено лише три doc-файли:
  - `docs/form-engine/items/JEK-E1.md` (spec + handoff);
  - `docs/form-engine/theme-neutral-hooks.md` (новий);
  - `docs/form-engine/WORKITEMS.md` (рядок JEK-E1).
  Код, тести, `_data/**`, `_includes/**`, `_plugins/**`, теми, CSS,
  `_form-engine/baseline/**` і `.opencode/skills/**` не редагувались.
- 2026-11-07: Статус — `review`: **T** 214/214, **V** 3/3, **CA** PASS.
  Flaky-ів немає; `VR`/`B`/`P` не потрібні для doc-only item-а.
- Commit SHA: `—` (агент не комітить; commit + merge `--no-ff` робить
  користувач після перегляду).
- 2026-11-07: Закриття (користувач): item commit **`2b9dc860`**
  (`JEK-E1: audit theme-neutral hooks`), merge `--no-ff` у
  `feature/form-engine` — **`aacfcf2e`**. Гілку `feat/JEK-E1-theme-hooks-audit`
  видалено; `git worktree list` містить лише канонічний `main`. Залишковий
  junction `node_modules` у каталозі worktree знято, порожній каталог
  видалено агентом.
- 2026-11-07: Статус — `done`. `WORKITEMS.md`: JEK-E1 → `done`,
  Commit `2b9dc860`; JEK-E2 → `ready` (єдина залежність виконана).
  На merged HEAD у канонічному `main` перепрогнано **T** 214/214,
  **V** 3/3, **CA** PASS.
