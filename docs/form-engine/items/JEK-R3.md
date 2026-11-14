# JEK-R3 — `check-add-property`: тріаж 13 copy-розбіжностей

Phase: 3 · Depends: BASE-5 · Repo: realtyua
Branch: `feat/JEK-R3-copy-triage` · Worktree: `../worktrees/JEK-R3-copy-triage`

Status: `done`

## Goal

Кожна з 13 copy-розбіжностей `check-add-property` явно розглянута й
зафіксована як свідомо прийнята зміна копірайту. Після item copy-шар гейта
зелений, а єдиним залишковим FAIL лишається структурний
`file info container` (JEK-R4).

## Контекст

- На HEAD `node _form-engine/tools/check-add-property.mjs` дає **14 failures**:
  13 copy + 1 структурний (`file info container`).
- Baseline `_form-engine/baseline/add-property-old.txt` — заморожений знімок
  старої сторінки (доданий у `178afaf8`).
- У тому ж `178afaf8` у `_data/add-property.yml` з'явилися пізніші правки
  української типографіки: `'` → `’`, «лапки» навколо `<b>Пошук</b>`,
  виправлення друкарської помилки `однму` → `одному`.
- Чекер порівнює текст із конфігу з **HTML-фрагментом** baseline
  (`extractFormSlice`), а не з JSON-островом конфігу, що теж є у файлі.

## Тріаж

Усі 13 — пізніші правки копірайту в конфігу, не дефекти рендера.
`config` = поточний `_data/add-property.yml` (джерело істини).

| # | Поле | Baseline (старе) | Config (прийняте) | Тип |
| --- | --- | --- | --- | --- |
| 1 | `start_alert_warning.label` | `кнопку <b>Пошук</b>` … `опцію <b>Пошук в оголошеннях</b>` | `кнопку «<b>Пошук</b>»` … `опцію «<b>Пошук в оголошеннях</b>»` | типографіка (лапки) |
| 2 | `communications.label` | `Комунікації в об'єкті нерухомості` | `… об’єкті …` | апостроф |
| 3 | `sell_with.label` | `Продаються разом з об'єктом нерухомості` | `… об’єктом …` | апостроф |
| 4 | `rent_with.label` | `Передається в оренду разом з об'єктом нерухомості` | `… об’єктом …` | апостроф |
| 5 | `location_widget.helper` | `… знаходиться об'єкт нерухомості` | `… об’єкт …` | апостроф |
| 6 | `district_settlement.helper` | `… не є обов'язковим` | `… обов’язковим` | апостроф |
| 7 | `house_section_address` option | `під'їзд` | `під’їзд` | апостроф |
| 8 | `map_widget.helper` | `… розташування об'єкта на мапі` | `… об’єкта …` | апостроф |
| 9 | `first_name.label` | `Ім'я` | `Ім’я` | апостроф |
| 10 | `images.label` | `Фотознимки об'єкта нерухомості` | `… об’єкта …` | апостроф |
| 11 | `images.helper` | `… загальне фото об'єкту нерухомості` | `… об’єкту …` | апостроф |
| 12 | `images.file.infoLine` | `… до 150KB в однму файлі` | `… до 150KB в одному файлі` | друкарська помилка |
| 13 | `captcha.helper` | `Якщо перевірка не з'явилася …` | `… не з’явилася …` | апостроф |

Висновок: пункти 2–11, 13 — суто типографіка апострофа; 1 — українські
лапки; 12 — виправлення друкарської помилки. Усі зміни вже в джерелі істини,
тому повертати їх до baseline не потрібно.

## Рішення (прийняте)

**Baseline лишається замороженим.** У `check-add-property.mjs` додається
явна, закоментована таблиця прийнятих пар `config ↔ baseline` (13 записів) і
copy-перевірка проходить, якщо рядок є в baseline **або** є прийнятим
відповідником із цієї таблиці.

Чому не переписувати baseline:

- baseline — доказ старої сторінки, а не поточний стан (AGENTS.md);
- файл — один рядок на 487 KB, тому 13 правок дають нечитабельний diff;
- явна таблиця робить кожну прийняту розбіжність видимою при рев'ю;
- жодного глобального «послаблення» нормалізатора: новий або змінений текст
  далі падає, якщо його немає ні в baseline, ні в таблиці.

Альтернатива (буквально за планом `~/.opencode/plan`, «оновити baseline»):
замінити 13 фрагментів у baseline. Не рекомендується з причин вище; якщо
обрано її — baseline змінюється свідомо, з переліком усіх 13 пар у handoff.

## Files

- `_form-engine/tools/check-add-property.mjs` — таблиця прийнятих
  відповідників + predicate для copy-перевірки.
- `docs/form-engine/items/JEK-R3.md` — цей файл (тріаж + handoff).
- `docs/form-engine/WORKITEMS.md` — рядок JEK-R3.

## Steps

1. Worktree `JEK-R3-copy-triage`, гілка `feat/JEK-R3-copy-triage`
   (detached HEAD → checkout).
2. Junction `node_modules` на `../../main/node_modules` (без `npm install`).
3. Baseline-гейти до змін: `npm test`, три `validate-config --strict`,
   `check-add-property` (зафіксувати 14 failures).
4. Додати до чекера таблицю 13 прийнятих пар і predicate copy-перевірки.
5. Гейти після змін: `npm test`, три `validate-config --strict`,
   `check-add-property`.
6. Handoff + оновити рядок у `WORKITEMS.md`.

## Acceptance

- `check-add-property`: рівно **1 FAIL** — `file info container`;
  усі 13 copy-перевірок `PASS` (і baseline, і render).
- `npm test` — без регресій (у канонічному чекауті 214/214).
- 3/3 конфіги валідні (`--strict`).
- `_form-engine/baseline/**` не змінений; `_data/add-property.yml` не
  змінений.
- Таблиця відповідників містить рівно 13 записів, кожен із посиланням на
  поле; новий невідомий текст далі валить copy-перевірку.

## Gates

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
```

CA після item очікувано червоний лише на `file info container` (JEK-R4).

## Out of scope

- Структурний `file info container` — JEK-R4.
- Переписування/перегенерація baseline (крім свідомо обраної альтернативи).
- Глобальна нормалізація апострофів/лапок у чекері (приховала б майбутній
  drift).
- Зміна копірайту в `_data/add-property.yml`.
- `verify-render` / повний build — не стосуються copy-шару.
- `reifua` (11ty) — EL-6.

## Handoff log

- 2026-11-04: Створено item зі `_TEMPLATE.md` (файл був відсутній).
  Репозиторій: `realtyua/main`, гілка `feature/form-engine`, робоче дерево
  чисте; worktree для JEK-R3 ще не створено.
- 2026-11-04: Користувач обрав **alias table** (baseline лишається
  замороженим), а не переписування `add-property-old.txt`.
- 2026-11-04: Worktree `../worktrees/JEK-R3-copy-triage`, гілка
  `feat/JEK-R3-copy-triage`, junction `node_modules` на
  `../../main/node_modules` (без `npm install`).
- 2026-11-04: Baseline-гейти до правок: `npm test` — 214/214 (у свіжому
  worktree спершу CRLF-vs-LF у `test/form-app-fresh.test.mjs`; після
  `node _form-engine/tools/gen-form-app.mjs` — зелено, це EOL-артефакт
  JEK-R8); 3/3 конфіги valid; `check-add-property` — 14 failures
  (13 copy + `file info container`).
- 2026-11-04: Змінено лише `_form-engine/tools/check-add-property.mjs`:
  додано явну таблицю `ACCEPTED_COPY_EDITS` (13 пар `baseline → config`,
  кожна з полем і типом правки) та predicate `copyInBaseline()`. Широкого
  нормалізатора не додано: невідомий текст далі падає.
- 2026-11-04: `_form-engine/baseline/**` і `_data/add-property.yml` не
  змінювались.
- 2026-11-04: Гейти після правок: `npm test` — 214/214; 3/3 конфіги valid;
  `check-add-property` — **1 failure**: `file info container` (JEK-R4).
  Усі 13 copy-перевірок `PASS` і в baseline, і в render.
- 2026-11-04: Generated `_includes/form/app/add-property.html` після
  регенерації відрізнявся лише `?v=` engine digest (EOL worktree, JEK-R8);
  відкочено до `HEAD`, у diff не входить.
- 2026-11-04: Commit SHA: немає (агент не комітить; staging/commit/merge —
  користувач).
- 2026-11-04: Користувач закомітив item: `13aa53ca` —
  `JEK-R3: accept reviewed add-property copy edits`; merge у
  `feature/form-engine`: `a9b83197` (`--no-ff`). Worktree прибрано.
- Залишок: `file info container` — окремий item JEK-R4. Baseline copy
  reconcile не робився (свідоме рішення).
