# JEK-R4 — `check-add-property`: структурний `file-info`

Phase: 3 · Depends: JEK-R3 · Repo: realtyua
Branch: `feat/JEK-R4-file-info` · Worktree: `../worktrees/JEK-R4-file-info`

Status: `review`

## Goal

`check-add-property` дає **0 failures**: структурна перевірка `file-info`
описує актуальний контракт рушія, а не Alpine-вузол старої сторінки. Рішення
(«перевіряти контракт» або «повернути клас у рендер») явно зафіксоване в коді
й у цьому файлі.

## Контекст

Після JEK-R3 єдиний FAIL гейта — `file info container`:

```text
FAIL  file info container
```

Причина — застаріла структурна перевірка в
`_form-engine/tools/check-add-property.mjs:260`:

```js
check(/class="file-info"/.test(html), 'file info container');
```

Що насправді було в старій сторінці (`_includes/form/field/file.html:63`):

```html
<div class="file-info" x-show="fileInfo('images')" x-text="fileInfo('images')"></div>
```

Це Alpine-слот: `x-text` заповнювався runtime-хелпером `fileInfo(name)`, а
`x-show` ховав його, коли хелпер повертав порожньо.

Що робить рушій:

- `assets/js/form-engine/themes/bootstrap4.js` (`file()`, ~368–406) і
  `.../themes/tailwind.js` (`file()`, ~558–592) рендерять статичний рядок
  лімітів у `<small class="form-text text-muted">` (з підстановкою
  `{min}`/`{max}`/`{limit}`) і контейнер `.file-previews`, але **не**
  `.file-info`;
- `assets/js/form-engine/page-form.js` (`syncFilesUI`, ~1060–1158) заповнює
  лише `.file-previews`; виробника `.file-info` у новому runtime немає;
- у `assets/js/form-engine/themes/*.css` немає стилів `.file-info`;
- тести вже фіксують відсутність як контракт:
  `test/render.test.mjs:320` і `test/render-tailwind.test.mjs:247` —
  `assert.doesNotMatch(html, /class="file-info"/)`.

Тобто FAIL — це не дефект рендера, а структурна перевірка, скопійована зі
старої Alpine-сторінки. Якби рушій додав `.file-info`, вузол лишався б
порожнім: у нього немає ні CSS, ні runtime-споживача.

## Рішення (прийняте)

2026-11-04: користувач обрав **варіант B** (перевіряти актуальний контракт).

**Варіант B — перевіряти актуальний контракт.** У
`check-add-property.mjs` замінити позитивну перевірку класу на явну негативну
перевірку з коментарем:

```js
// JEK-R4: `.file-info` was an Alpine-only text slot in the old page
// (x-text="fileInfo(name)"). The engine keeps the static limits line in
// <small> and per-file details in .file-previews; it intentionally emits no
// .file-info node. Keep the absence explicit so a re-added dead slot fails.
check(!/class="file-info"/.test(html), 'no Alpine-only file-info slot');
```

Покриття не втрачається:

- текст лімітів далі перевіряється copy-шаром (`copy in render`);
- контейнер `.file-previews mt-2` далі перевіряється структурним шаром;
- новий/невідомий текст далі падає (таблиця JEK-R3 не змінюється).

**Альтернатива A — повернути клас у рендер.** Додати
`<div class="file-info" hidden></div>` у `file()` обох тем і змінити два
тести з `doesNotMatch` на `match`. Відхилено: це додає мертвий вузол у дві
теми й не має runtime-споживача; цінність гейта не зростає.

## Files

- `_form-engine/tools/check-add-property.mjs` — замінити перевірку `file info
  container` (рядок 260) на негативний контракт + коментар JEK-R4.
- `docs/form-engine/items/JEK-R4.md` — цей файл (рішення + handoff).
- `docs/form-engine/WORKITEMS.md` — рядок JEK-R4.

Не змінюються (варіант B): `_form-engine/baseline/**`, `_data/add-property.yml`,
`assets/js/form-engine/**`, `test/**`.

## Steps

1. Worktree `JEK-R4-file-info`, гілка `feat/JEK-R4-file-info`
   (detached HEAD → `git checkout -b`).
2. Junction `node_modules` на `../../main/node_modules` (без `npm install`).
3. Baseline-гейти до змін: `npm test`, три `validate-config --strict`,
   `check-add-property` (зафіксувати рівно 1 FAIL — `file info container`).
4. Замінити перевірку в чекері згідно з варіантом B.
5. Гейти після змін: `npm test`, три `validate-config --strict`,
   `check-add-property` (очікувано 0 failures).
6. Handoff + оновити рядок у `WORKITEMS.md`.

## Acceptance

- `node _form-engine/tools/check-add-property.mjs` — **0 failures**
  (`check-add-property: PASS`).
- Перевірка `file-info` явно фіксує відсутність Alpine-слота; вона падає,
  якщо хтось поверне `class="file-info"` без runtime-споживача.
- `npm test` — без регресій (у канонічному чекауті 214/214).
- 3/3 конфіги валідні (`--strict`).
- `_form-engine/baseline/**`, `_data/add-property.yml`, рендерер і тести не
  змінені.
- Рішення й причина записані в item-файлі та handoff.

## Gates

`T`, `V`, `CA`.

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
```

## Out of scope

- Новий runtime-функціонал `.file-info` (зведення по файлах, CSS, glue).
- Перегенерація або правка `_form-engine/baseline/**`.
- Таблиця copy-відповідників JEK-R3 і `_data/add-property.yml`.
- `check-notify` і `verify-render` — не стосуються структурного шару.
- `reifua` (11ty) — EL-6.
- EOL-артефакти worktree — JEK-R8.

## Handoff log

- 2026-11-04: Item створено зі `_TEMPLATE.md` (файл був відсутній).
  Репозиторій: `realtyua/main`, гілка `feature/form-engine`, HEAD `a06ffdd5`,
  робоче дерево чисте.
- 2026-11-04: Worktree `../worktrees/JEK-R4-file-info`, гілка
  `feat/JEK-R4-file-info` (detached HEAD → checkout), junction `node_modules`
  на `../../main/node_modules` (без `npm install`).
- 2026-11-04: Baseline-гейти до правок: `npm test` — 214 тестів, 213 pass,
  1 fail (`test/form-app-fresh.test.mjs`: baked-файл CRLF проти LF у fresh
  render; відомий EOL-артефакт JEK-R8, не регресія); 3/3 конфіги valid;
  `check-add-property` — 1 failure (`file info container`).
- 2026-11-04: Єдина зміна в коді — `_form-engine/tools/check-add-property.mjs`:
  позитивну перевірку `class="file-info"` замінено на явний негативний
  контракт із коментарем JEK-R4 (`no Alpine-only file-info slot`). Baseline,
  `_data/add-property.yml`, рендерер і тести не змінювались.
- 2026-11-04: Гейти після правок: `check-add-property` — **PASS**, 0 failures
  (exit 0); `npm test` — ті самі 213/214, єдиний fail — відомий EOL-артефакт
  JEK-R8; 3/3 конфіги valid.
- 2026-11-04: Commit SHA: немає (агент не комітить; staging/commit/merge —
  користувач).
- 2026-11-05: Сесію відновлено після переривання. Повторно запущено
  `check-add-property` — **PASS**, 0 failures (exit 0). Код після цього не
  змінювався; зміни лишаються в робочому дереві worktree.
