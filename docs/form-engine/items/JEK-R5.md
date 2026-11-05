# JEK-R5 — Мертвий код: legacy partial-и, дубль notify, сирота, `.old`

Phase: 3 · Depends: BASE-5 · Repo: realtyua
Branch: `feat/JEK-R5-dead-code` · Worktree: `../worktrees/JEK-R5-dead-code`

Status: `review`

## Goal

У `_includes/form/**` лишається тільки робочий шлях `app/`; трекнутий дубль
notify, сирітський запечений notify і legacy Liquid-partial-и видалені; локальні
`.old`-артефакти або прибрані, або явно залишені як архів; застарілий коментар
у робочій модалці виправлений. Рендер трекнутих сторінок не змінюється.

## Контекст

План (`~/.opencode/plan/form-engine-plan.md`, §4.3): «33 legacy partial-и в
`_includes/form/**` (крім `app/`) мають 0 посилань». Фактична інвентаризація
на HEAD `37560e85`:

| Група | Файли | Посилання |
| --- | --- | --- |
| `_includes/form/*.html` | `addon`, `attributes`, `label`, `modal`, `modals`, `notify-property`, `render` (7) | лише всередині `_includes/form/**` |
| `_includes/form/content/*.html` | 7 | лише з `form/render.html` |
| `_includes/form/field/*.html` | 13 | лише з `form/render.html` |
| `_includes/form/widget/*.html` | 5 | лише з `form/widget/render.html` |
| **Разом partial-ів** | **32** | 0 входів ззовні `_includes/form/**` |
| `_includes/form/php/*` | 4 | копії `php/*` (відрізняються лише відсутнім `\n` в EOF) |
| `_includes/form/python/*` | 3 | копії `python/*` (байт-у-байт) |
| `_includes/form/app/notify.html` | 1 | жодна сторінка не include-ить; notify рендериться з JSON-острівців |

Перевірено `grep` по `*.html,*.md,*.yml,*.rb,*.js,*.mjs,*.json,*.njk,*.liquid`:
єдині згадки legacy-шляхів поза `_includes/form/**` — це документація
(`_form-engine/README.md`, `.opencode/skills/**`, `docs/**`) і коментар у
`verify-render.ps1`. Жоден `_layouts/*`, сторінка, `_data/*.yml`, `_plugins/*`
чи тест не включає legacy-partial.

Ноtarно:
- `_includes/form/notify-property.html` — стара копія робочої
  `_includes/modals/notify-property.html`, без module-script, доданого JEK-R9;
- `_includes/form/app/notify.html` — запечений фрагмент (`<!-- form-bake ... -->`),
  який ніхто не include-ить; `_plugins/form_engine.rb` пече лише форми, на які
  є `{% include form/app/<name>.html %}`;
- робоча модалка `_includes/modals/notify-property.html:14` досі каже
  «rendered by assets/js/form-notify.js», хоча файлу немає, а з JEK-R9
  підключено `assets/js/form-engine/app.js`.

Локальні (ігноровані `.git/info/exclude`) артефакти поза Git:

| Шлях | Розмір | Примітка |
| --- | --- | --- |
| `_includes/add-property.html.old` | ~109 KB | стара сторінка |
| `assets/js/add-property.js.old` | 13 KB | старий page-glue |
| `assets/js/notify.js.old` | 10.5 KB | старий notify-glue |
| `opencode.jsonc.old` | 656 B | стара конфігурація OpenCode |
| `context.old/session-17-refactor.md` | 2.2 MB | локальний контекст сесії |
| `opencode_sessions_final.json` | 539 KB | експорт сесій OpenCode |

## Рішення

- **Partial-и:** видалити всі 32 (`_includes/form/**` без `app/`). Вони
  утворюють замкнений граф взаємних include-ів без жодного входу ззовні.
- **Дубль notify:** видалити `_includes/form/notify-property.html`.
- **Сирота:** видалити `_includes/form/app/notify.html`; він не бере участі
  в жодному build-шляху й не перевіряється тестами.
- **Коментар:** у `_includes/modals/notify-property.html` замінити згадку
  `assets/js/form-notify.js` на `assets/js/form-engine/app.js` (новий entry).
- **`.old` / `context.old/`:** видалити form-related артефакти —
  `_includes/add-property.html.old`, `assets/js/add-property.js.old`,
  `assets/js/notify.js.old`, `context.old/`. Лишити як локальний архів
  OpenCode-артефакти `opencode.jsonc.old` і `opencode_sessions_final.json`
  (вони не стосуються Form Engine). Файли ігноровані, у diff не потрапляють.
- **`_includes/form/php/**`, `_includes/form/python/**`:** видалити як мертві
  копії (канонічні `php/` і `python/` у корені лишаються, `_includes/`
  Jekyll не публікує).

## Files

- `_includes/form/**` — видалити 32 legacy partial-и (список нижче).
- `_includes/form/notify-property.html` — видалити (дубль).
- `_includes/form/app/notify.html` — видалити (сирота).
- `_includes/form/php/**` (4) і `_includes/form/python/**` (3) — видалити
  (мертві копії кореневих `php/` і `python/`).
- `_includes/add-property.html.old`, `assets/js/add-property.js.old`,
  `assets/js/notify.js.old`, `context.old/` — видалити локально (ignored).
  `opencode.jsonc.old` і `opencode_sessions_final.json` — лишити як архів.
- `_includes/modals/notify-property.html` — оновити коментар.
- `docs/form-engine/items/JEK-R5.md` — цей файл.
- `docs/form-engine/WORKITEMS.md` — рядок JEK-R5.
- `.opencode/skills/form-engine/references/jekyll-adapter.md` — прибрати
  «Відомий борг (JEK-R5)» після виконання (рядок 88–90).

Видалити (32):

```text
_includes/form/addon.html
_includes/form/attributes.html
_includes/form/label.html
_includes/form/modal.html
_includes/form/modals.html
_includes/form/render.html
_includes/form/content/{alert,badge,heading,image,list,paragraph,raw}.html
_includes/form/field/{autocomplete,checkbox,checkbox_group,email,file,location,
  number,radio,region,select,tel,text,textarea}.html
_includes/form/widget/{captcha,location,map,price_info,render}.html
```

Не змінюються: `_includes/form/app/add-property.html` (generated),
`_data/**`, `assets/js/form-engine/**`, `_form-engine/baseline/**`,
`_plugins/form_engine.rb`, `_layouts/**`.

## Steps

1. Worktree `JEK-R5-dead-code`, гілка `feat/JEK-R5-dead-code`
   (detached HEAD → `git checkout -b`).
2. Junction `node_modules` на `../../main/node_modules` (без `npm install`).
3. Baseline-гейти до змін: `npm test`, `verify-render.ps1 verify`
   (build + `check-notify` + порівняння з baseline).
4. Видалити 32 legacy partial-и, `_includes/form/php/**`,
   `_includes/form/python/**`, дубль notify і сироту; оновити коментар.
5. Видалити локальні form-related артефакти (`*.old`, `context.old/`);
   `opencode.jsonc.old` і `opencode_sessions_final.json` лишити.
6. Гейти після змін: `npm test`, `verify-render.ps1 verify` — рендер
   байт-у-байт (крім module-script/`?v=`-токена, які вже покриває baseline).
7. Handoff + оновити рядок у `WORKITEMS.md`.

## Acceptance

- `_includes/form/` містить лише `app/` (плюс канонічні `php/`, `python/` у
  корені репозиторію, які не чіпались).
- `grep` не знаходить жодного `{% include form/<legacy>` у трекнутих файлах.
- `_includes/modals/notify-property.html` не згадує `form-notify.js`.
- `npm test` — без регресій (у канонічному чекауті 214/214).
- `verify-render.ps1 verify` — без незапланованих diff; `check-notify` PASS.
- `_form-engine/baseline/**`, `_data/**`, рендерер і тести не змінені.
- `.old`-артефакти: form-related видалені, OpenCode-архів
  (`opencode.jsonc.old`, `opencode_sessions_final.json`) лишений; рішення
  зафіксоване в handoff.

## Gates

`T`, `VR`.

```powershell
npm test
powershell -File _form-engine/tools/verify-render.ps1 verify
```

## Out of scope

- `_form-engine/README.md` (застарілий статус і згадки legacy) — JEK-R6.
- Повний прогін усіх гейтів (`V`, `CA`, `CN` окремо) — JEK-R7; `CN` уже
  виконується всередині `VR`.
- Правки `assets/js/form-engine/**`, `_data/**`, `_plugins/**`, `_layouts/**`.
- Перегенерація або правка `_form-engine/baseline/**`.
- `reifua` (11ty) — EL-*.
- Зміна `.git/info/exclude` (локальний файл поза Git).
- Чистка історичних коментарів у runtime-модулях (`form-engine.js:...`).

## Handoff log

- 2026-11-05: Item створено зі `_TEMPLATE.md` (файл був відсутній).
  Репозиторій: `realtyua/main`, гілка `feature/form-engine`, HEAD `37560e85`,
  робоче дерево чисте; worktree ще не створено.
- 2026-11-05: Worktree `../worktrees/JEK-R5-dead-code`, гілка
  `feat/JEK-R5-dead-code` (detached HEAD → `git checkout -b`). Junction
  `node_modules` на `../../main/node_modules` (без `npm install`).
- 2026-11-05: Baseline-гейти **до** змін. `npm test` — 214 тестів, 213 pass,
  1 fail (`test/form-app-fresh.test.mjs`: baked-сторінка CRLF проти LF у fresh
  render; відомий EOL-артефакт JEK-R8, не регресія). `verify-render.ps1 verify`
  — **FAIL 3/3** ще на незайманому HEAD: `new.html` (bake sha + EOL),
  `assets/data/form-config.json` (whitespace/EOL) і property-сторінка
  (baseline старіший за JEK-R9, бракує `<script type="module" … app.js?v=BUILD>`).
  `check-notify: ok (1 page)`. Baseline не «лікувався». Стан `_site` до змін
  збережено в `%TEMP%\opencode\JEK-R5-before\`.
- 2026-11-05: Видалено 40 трекнутих файлів: 32 legacy Liquid-partial-и
  (`_includes/form/**` без `app/`, включно з дублем `form/notify-property.html`),
  сироту `_includes/form/app/notify.html`, мертві копії `_includes/form/php/**`
  (4) і `_includes/form/python/**` (3). У `_includes/form/` лишився тільки
  `app/add-property.html`; кореневі `php/` і `python/` не чіпались. `grep`
  у трекнутих файлах не знаходить жодного `{% include form/<legacy>`.
- 2026-11-05: У `_includes/modals/notify-property.html` коментар виправлено:
  `assets/js/form-notify.js` → `assets/js/form-engine/app.js`. У
  `.opencode/skills/form-engine/references/jekyll-adapter.md` прибрано
  «Відомий борг (JEK-R5)» і згадку видаленого `form/app/notify.html`.
- 2026-11-05: Локальні ігноровані артефакти видалено в робочому дереві
  `realtyua/main` (у worktree їх не було): `_includes/add-property.html.old`,
  `assets/js/add-property.js.old`, `assets/js/notify.js.old`, `context.old/`.
  Лишено як OpenCode-архів: `opencode.jsonc.old`, `opencode_sessions_final.json`.
  `.git/info/exclude` не змінювався, у diff ці шляхи не потрапляють.
- 2026-11-05: Гейти **після** змін. `npm test` — 214 тестів, 213 pass, 1 fail;
  той самий `the baked add-property page matches a fresh render of the config`
  (EOL, JEK-R8), 0 нових падінь. `verify-render.ps1 verify` — той самий
  **FAIL 3/3** з тими самими трьома різницями; `check-notify: ok (1 page)`.
- 2026-11-05: Доведено, що видалення інертне: `_site/new.html` після змін
  збігається з `JEK-R5-before/new.html` після нормалізації `?v=<token>`;
  `_site/assets/data/form-config.json` — байт-у-байт; зріз notify-модалки
  (`id="notifyModal"` → `<hr>`, саме його перевіряє гейт) — ідентичний.
  Решта різниць property-сторінки — випадкові SEO-синоніми Liquid-фільтра
  `sample` (`_includes/property/price-name.html`, `property/start-ads.html`),
  не пов'язані з item-ом.
- 2026-11-05: Після build відновлено generated
  `_includes/form/app/add-property.html` до вмісту HEAD (bake змінював лише
  `?v=`-рядок). `_form-engine/baseline/**`, `_data/**`, `_plugins/**`,
  `_layouts/**`, рендерер і тести не змінювались.
- 2026-11-05: Commit SHA: — (не комічено; staging/commit/merge — за
  користувачем). Junction `node_modules` лишено для перевірки; зняти перед
  `worktree_remove`.
