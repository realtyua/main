# MOD-9 — Captcha як engine-асет для modal-форми (notify)

Phase: 8 · Depends: MOD-7 · Repo: form-engine + realtyua
Branch: `feat/MOD-9-realtyua-captcha` · Worktree: `../worktrees/MOD-9-realtyua-captcha` (realtyua continuation, uncommitted). Form-engine step 2 раніше: `feat/MOD-9-modal-captcha-assets` (merged→`e919267`, cleaned).

Status: `done`

> Продовження MOD-7: після видалення site-level ін'єкції captcha зникла на
> property-сторінках, бо notify не проходить через `renderPage`. MOD-9 переводить
> notify на engine-шлях modal-рендеру/бейку з captcha як engine-асетом.
>
> Уточнення 2026-11-19: **ціль MOD-9 — зробити notify робочою за поточною
> (переписаною) структурою `_data/notify.yml`** у цьому worktree. Цільова
> конфігурація збережена як `docs/form-engine/items/MOD-9-notify.target.yml`.
> Узагальнення modal-runtime, необхідне для роботи цього конфігу, виконується в
> межах MOD-9; ширша уніфікація (повний паритет/контракти) винесена в MOD-10..MOD-12.

## Goal

Notify (`behavior.mode: modal`) працює через engine-шлях (bake/mount/runtime) і
конфігурується поточним `_data/notify.yml`: captcha оголошена як `widget: captcha`
(engine-асет, без site-level ін'єкцій і без raw Turnstile-блоку в конфігу), форма
коректно монтується, валідуюється та відправляється відповідно до конфігурації.

## Files

`form-engine` (вже виконано для 1.0.5 + локальні незакомічені виправлення):

- `runtime/shell.js` — `renderAssets` + `renderModal` (повний modal island з `id/version/behavior`, асети + `app.js` без wizard-chrome)
- `adapters/jekyll/tools/gen-form-app.mjs` — bake modal-фрагмента при `behavior.mode: modal`
- `adapters/jekyll/tools/check-notify.mjs` — перевірка `widget: captcha`, контракту modal-bake і відсутності дублів асетів/app.js (умовно для captcha-асетів)
- `test/modal-captcha.test.mjs` (+ пов’язані тести за потреби)
- `package.json` / `package-lock.json` / `CHANGELOG.md` — `1.0.5`

`realtyua` (MOD-9 continuation, цей worktree):

- `_data/notify.yml` — цільова конфігурація notify (переписана; див. snapshot)
- `_includes/modals/notify-property.html` — хост: baked `form/app/notify.html` + `notify-page` island
- `_includes/form/app/notify.html` — згенерований modal-фрагмент (rebake)
- `assets/js/form-engine/*` (+ `_form-engine/**` у разі sync з пакета) — мінімальні зміни modal/runtime, необхідні для роботи поточного конфігу (config-driven modal boot/captcha/submit/status/lifecycle hooks у межах MOD-9)
- `test/notify-config.test.mjs`, `docs/form-engine/items/MOD-9.md`, `docs/form-engine/WORKITEMS.md`
- (за потреби) інші тести/фрагменти, якщо цього вимагає прийняття поточного `notify.yml`

## Steps

1. Baseline/стан у worktree (1.0.5 + sync/rebake) — **виконано частково**.
2. Привести `notify.yml`/modal-host до engine-шляху (`widget: captcha`, baked include) — **виконано (uncommitted)**.
3. Узагальнити modal-runtime мінімально, щоб поточний `notify.yml` працював як сконфігуровано (монтування за `behavior.mode`/name, captcha з конфігу `element_id/action/token`, submit/валідація/стани, сумісність з поточною структурою) — **в роботі**.
4. Rebake notify (і за потреби sync), `jekyll build --limit_posts 1`, релевантні валідації/гейти/тести.
5. Задокументувати знахідки та винести загальну уніфікацію в MOD-10..MOD-12.
6. Жива перевірка на property-сторінці з увімкненим Turnstile — користувач/окремо.
7. Після «прийнято»: локальний цикл (commit/merge/SHA/cleanup) у відповідних репо; рішення щодо form-engine patch/release для локальних фіксів 1.0.5; push — користувач.

## Acceptance

- [x] `notify.yml` оголошує captcha через `widget: captcha` (без raw Turnstile HTML у конфігу)
- [x] Notify проходить engine modal-шлях (baked `form/app/notify.html` підключено в modal-host, config island/behavior присутні)
- [ ] Поточний `_data/notify.yml` (цільова структура) працює в модалці: поля рендеряться, валідація/required поводяться за конфігом, captcha інтегрується за конфігом, форму можна відправити, стани помилки/успіху коректні
- [x] Captcha як engine-асет: для конфігу з `widget: captcha` асети/конфіг емітуються через engine-шлях; на сторінках без `widget: captcha` captcha-теги відсутні; дублювання `TURNSTILE_CONFIG`/`captcha.js`/`api.js`/`app.js` не допускається (перевіряється `check-notify`, з урахуванням умов `turnstile_enabled`)
- [ ] `node _form-engine/tools/validate-config.mjs _data/notify.yml --strict` — valid; `check-notify _site` — ok; релевантні тести/гейти MOD-9 зелені (відомі позаскоупні drifts задокументовані)
- [x] Жива перевірка property-сторінки з увімкненим Turnstile: captcha відображається і працює, зайвих запитів captcha-скриптів немає (користувач, 2026-11-19)

## Gates

```powershell
# realtyua worktree (MOD-9)
bundle exec jekyll build --limit_posts 1
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-notify.mjs
# за потреби/наявності:
npm test
node _form-engine/tools/check-add-property.mjs
powershell -File _form-engine/tools/verify-render.ps1 verify

# form-engine (за наявності змін у ядрі/адаптері)
npm test
```

## Out of scope

- Повна уніфікація form-engine (винесено в MOD-10..MOD-12): загальний chrome/actions-контракт, повний паритет усіх можливостей page/modal, рефакторинг поза потребами MOD-9
- 11ty-двійник (`reifua`) — окремий parity item
- CSP/консольний шум Cloudflare Turnstile — не міняти
- MOD-8 (перезахоплення baseline), MOD-4, MOD-5
- Публікація npm/мережеві дії; push — користувач

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-19: **item зареєстровано, статус `todo`.** Попередня сесія лише
  підготувала запис; реалізація — окрема сесія `/item MOD-9`.
- 2026-11-19: **form-engine крок 2 (локально, прийнято).** Scope цієї
  сесії обмежено до form-engine; версія узгоджена як `1.0.5` (не `1.1.0`).
  Worktree: `C:\Users\Vasyl\Documents\GitHub\worktrees\MOD-9-modal-captcha-assets`
  (repo `form-engine`), гілка `feat/MOD-9-modal-captcha-assets` від `b5cf7b3`,
  `node_modules` — junction на `C:\Users\Vasyl\Documents\GitHub\form-engine\node_modules`.
  Файли змінено: `runtime/shell.js` (експорт `renderAssets` + `renderModal`,
  спільний captcha-gate), `adapters/jekyll/tools/gen-form-app.mjs` (bake modal
  при `behavior.mode: modal`), `adapters/jekyll/tools/check-notify.mjs`
  (вимога `widget: captcha`, рівно 1× `TURNSTILE_CONFIG`/`captcha.js`/
  Turnstile `api.js`/`app.js`), `test/modal-captcha.test.mjs` (новий),
  `package.json`, `package-lock.json`, `CHANGELOG.md` (`1.0.5`).
  **Gates (form-engine):** baseline `npm test` — 186/186 pass (до змін);
  після змін `npm test` — **190/190 pass**; `npm test -- --test-name-pattern=captcha`
  — запуск виконано, усі тести зелені (190/190 pass у повному прогоні).
  **Локальний цикл (після «прийнято», частково):** form-engine item commit
  `d3eaf9076c55e9b31ff8d1b33a54b287f494a1a9` (`d3eaf90`), merge `--no-ff` у
  `master` (form-engine) — `e919267df9f98082a3f6cf3f262f27794f1f7b65`; гілку
  видалено, worktree прибрано після зняття junction. Docs/реєстр realtyua —
  окремий локальний цикл у цьому ж сеансі (див. commit реєстру).
  **Leftovers:** npm publish `1.0.5` — користувач; кроки 3–5 realtyua
  (`_data/notify.yml`, `_includes/modals/notify-property.html`, sync/версії,
  build/gates, жива перевірка) — наступна сесія після публікації; 11ty parity —
  окремий item. Push — користувач. **Статус item:** `doing`. **Commit SHA:** `d3eaf90` (form-engine).

- 2026-11-19: **realtyua continuation, варіант A (локально, uncommitted).**
  Користувач: у `realtyua/main` виконано `npm install @realtyua/form-engine@1.0.5`
  (опубліковано), потім дозволено «роби A». Підготовка: worktree
  `C:\Users\Vasyl\Documents\GitHub\realtyua\worktrees\MOD-9-realtyua-captcha`,
  гілка `feat/MOD-9-realtyua-captcha` від `808c13e9` (`realtyua/master`);
  `node_modules` — junction на `..\..\main\node_modules`; у worktree скопійовано
  `package.json`/`package-lock.json` з `main` (1.0.5), виконано `sync-form-engine`.
  **Baseline (до змін notify, після sync/1.0.5):** `validate-config` add-property/
  notify/demo — valid; `npm test` — 1 fail (`test/form-app-fresh.test.mjs`: stale
  baked add-property після апгрейду engine) → виправлено ребейком `add-property`.
  **Виявлені проблеми 1.0.5:** `renderModal` емітив island без `id`/`version`/
  `behavior` (modal boot/checks не працювали), `check-notify` вимагав пререндерену
  `<form>` та безумовно 1× captcha-асети (несумісно з modal-bake і
  `turnstile_enabled: false`). **Form-engine (локально, uncommitted, без commit/
  merge/push):** `runtime/shell.js` — modal island тепер містить `id`, `version`,
  `behavior`; `adapters/jekyll/tools/check-notify.mjs` — умовна перевірка captcha-
  асетів (0 дозволено, якщо асети відсутні; при наявності — рівно 1× кожного) та
  збережена віртуальна перевірка render-контракту; `test/modal-captcha.test.mjs` —
  перевірка полів island. `node --test test/modal-captcha.test.mjs` — **4/4 pass**.
  **Пропаговано в realtyua:** копія `@realtyua/form-engine` у
  `realtyua/main/node_modules/@realtyua/form-engine` замінена на виправлену з
  локального `form-engine`; у worktree `sync-form-engine`, rebake `add-property`,
  `demo`, `notify`.
  **Зміни realtyua (worktree, uncommitted):** `_data/notify.yml` (raw
  `#turnstile-widget` → `widget: captcha`, `element_id: turnstile`,
  `action: notify_property`, `theme: light`, `size: flexible`);
  `_includes/modals/notify-property.html` (видалено ручні `notify-config`/`app.js`,
  лишено `#notify-page`, додано `{% include form/app/notify.html %}`);
  згенеровано `_includes/form/app/notify.html`; rebaked `_includes/form/app/add-property.html`,
  `_includes/form/app/demo.html`; `package.json`/`package-lock.json` (1.0.5);
  синхронізовано `_form-engine/**`, `assets/js/form-engine/**` (з виправленого
  пакета). Оновлено `test/notify-config.test.mjs` під нову widget-розмітку captcha
  (замість raw `<div id="turnstile-widget" class="mb-3">`).
  **Build:** `bundle exec jekyll build --limit_posts 1` — **успішно** (~250s/274s,
  `FormEngine: baked add-property, demo, notify`), `turnstile_enabled: false` у
  `_config.yml` (captcha-асети в local build відсутні, `check-notify` ок).
  **Gates (realtyua worktree):** `validate-config` add-property/notify/demo — 3/3
  valid; `node _form-engine/tools/check-notify.mjs _site` — **ok (1 page)**;
  `node _form-engine/tools/check-add-property.mjs` — **4 failures** (autocomplete:
  main/select/placeholder/search) — відома/зафіксована drift-розбіжність;
  `npm test` (повний прогін після змін) — **224/228 pass, 4 fail**: 3×
  `test/add-property-wire.test.mjs` (district/type_address autocomplete controls
  not mounted) та 1× `test/notify-config.test.mjs` (очікування raw captcha div) —
  останній виправлено в цій сесії; після фіксу `node --test test/notify-config.test.mjs`
  **10/10 pass**, `node --test test/add-property-wire.test.mjs` — **19/22, 3 fail**
  (ті самі autocomplete-монтування; ймовірно пов’язано з ребейком/поведінкою 1.0.5
  для add-property, не з notify/modal; потребує окремого розбору);
  `powershell -File _form-engine/tools/verify-render.ps1 verify` — **FAIL 3/3**
  (`new.html` і `assets/data/form-config.json` changed після rebake/sync,
  tracked post replaced `district/town/kosiv/...` → `region/city/yaremche/...`),
  baseline свідомо не перезахоплювався (див. MOD-8).
  **Leftovers:** (1) **form-engine**: виправлення (modal island + check-notify)
  внесені локально в `C:\Users\Vasyl\Documents\GitHub\form-engine` (uncommitted)
  і розходяться з **опублікованим npm `1.0.5`** — потрібне рішення користувача:
  commit/release/patch/publish (наприклад 1.0.6) чи інша стратегія; (2) **realtyua**:
  всі зміни uncommitted в worktree + `M package.json`, `M package-lock.json` у
  `realtyua/main` — після огляду/«прийнято» локальний цикл (commit/merge --no-ff/
  SHA/cleanup), push — користувач; (3) жива перевірка notify captcha на property-
  сторінці з увімкненим Turnstile; (4) 3× add-property-wire autocomplete failures
  і `check-add-property` — заведено **MOD-13** (2026-11-20); `verify-render`
  дрейф закрито MOD-8; (5) 11ty parity — окремо.
  **Статус item:** `doing`. **Commit SHA:** — (без комітів у цій сесії).

- 2026-11-19: **переписано `_data/notify.yml` (цільова структура, користувач).**
  `notify.yml` переписано під config-driven підхід (див. snapshot
  `docs/form-engine/items/MOD-9-notify.target.yml`). Виявлено розриви: modal-runtime
  (`modal-form.js`) notify-специфічний/хардкоджений (фіксовані ID `#notify-*`,
  `#turnstile-widget`, дія `notify_property`, очікування submit/status/retry елементів),
  немає `dnscheck` у modal, відсутня кнопка submit у конфігу, відмінності поведінки
  полів між `page-form.js` та `modal-form.js`. **Рішення:** MOD-9 виконуємо під
  поточний `notify.yml` (мінімальна генералізація runtime в межах MOD-9); загальну
  уніфікацію/паритет винесено в MOD-10..MOD-12. **Статус item:** `doing`.

- 2026-11-19: **docs + реалізація під поточний `notify.yml` (локально, прийнято).**
  **Docs:** snapshot `docs/form-engine/items/MOD-9-notify.target.yml`; оновлено
  `docs/form-engine/items/MOD-9.md`, `docs/form-engine/WORKITEMS.md`; створено
  `docs/form-engine/items/MOD-10.md`, `MOD-11.md`, `MOD-12.md` (уніфікація винесена).
  **Runtime/bake:** узагальнено `assets/js/form-engine/modal-form.js` (config-driven
  captcha за widget-полями: `element_id|name` → `*-widget`, `action`, `token`;
  автогенерація submit/status за потреби; prefill з `<name>-page`; `dnscheck` для
  email-полів; сумісність з legacy `notify-*`; lifecycle mount/unmount/reset).
  Пропаговано в `C:\Users\Vasyl\Documents\GitHub\form-engine\runtime\modal-form.js`
  та `C:\Users\Vasyl\Documents\GitHub\realtyua\main\node_modules\@realtyua\form-engine\runtime\modal-form.js`
  (локально, uncommitted поза worktree). Rebake `notify` → `_includes/form/app/notify.html`.
  `test/notify-config.test.mjs` оновлено під цільовий конфіг/рендер (captcha widget,
  актуальні поля/валідації/layout/лічильник, dnscheck). **Gates:** `validate-config
  _data/notify.yml --strict` — valid; `gen-form-app` notify — ok; `bundle exec jekyll
  build --limit_posts 1` — ok (`FormEngine: baked add-property, demo, notify`, exit 0;
  локально `turnstile_enabled: false`); `node _form-engine/tools/check-notify.mjs _site`
  — ok (1 page); `node --test test/notify-config.test.mjs` — 8/8 pass. **Файли (worktree):**
  `_data/notify.yml`, `_includes/modals/notify-property.html`, `_includes/form/app/notify.html`,
  `_includes/form/app/add-property.html`, `_includes/form/app/demo.html`,
  `docs/form-engine/WORKITEMS.md`, `docs/form-engine/items/MOD-9.md`,
  `docs/form-engine/items/MOD-9-notify.target.yml`, `docs/form-engine/items/MOD-10.md`,
  `docs/form-engine/items/MOD-11.md`, `docs/form-engine/items/MOD-12.md`,
  `package.json`, `package-lock.json`, `test/notify-config.test.mjs` (tracked changes/adds).
  **Leftovers:** жива перевірка notify+Turnstile на property-сторінці (користувач/env);
  позаскоупні/відомі drifts: `check-add-property`, `add-property-wire` autocomplete,
  `verify-render` (MOD-8), повний `npm test`; незакомічені фікси в `form-engine`
  (modal island/check-notify + modal-form runtime) розходяться з опублікованим `1.0.5`
  — потрібне рішення щодо patch/release; `realtyua/main` має пропатчений `node_modules`
  та `M package.json/lock`. **Статус item:** `done` (реалізація/гейти прийнято; live
  Turnstile — очікує користувача). **Commit SHA (item):** `5a6b2d93`, merge `d05fb9de`.

- 2026-11-19..20: **live follow-up, випуск 1.0.7 і фінальна верифікація (користувач).**
  Після деплою виявлено, що captcha в notify показує `[Успіх!]`, але submit
  не проходив (лист не надходив). **Причини/фікси:**
  (1) `form-engine` `runtime/modal-form.js` потребував синхронізації solved
  стану/токена з контролером (poll/watch + sync перед `validateAll`) для
  config-driven captcha widget-ів — фікс закомічено `6c97a3a`, підготовлено
  реліз `1.0.7` (`f9466f8`, `CHANGELOG`/версії), опубліковано користувачем;
  `realtyua` оновлено до `@realtyua/form-engine@1.0.7` (`03a06d9e`) і задеплоєно.
  (2) Узгоджено Turnstile `action` у notify з воркером
  (`workers/notify-worker.js` очікує `notify_property`): `_data/notify.yml`
  `notify` → `notify_property`, rebake `_includes/form/app/notify.html`,
  commit `d5251b4c` (realtyua `master`), push/deploy користувачем.
  **Жива перевірка (https://www.realestate.if.ua, 2026-11-19):** дублів
  `api.js`/`captcha.js` немає; `add-property` — captcha `[Успіх!]`, submit/лист
  ок; `notify` — captcha `[Успіх!]`, submit/лист ок. **Статус item:** `done`
  (live Turnstile підтверджено). **Залишки/прибирання:** позаскоупні drifts
  (`check-add-property`, `add-property-wire`, `verify-render`/MOD-8, повний
  `npm test`) лишаються окремими items; перевірити відсутність/видалити
  залишковий worktree/гілку `feat/MOD-9-realtyua-captcha`, якщо ще є локально;
  за потреби привести до ладу службові нотатки/реєстр після остаточного закриття.
