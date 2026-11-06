# JEK-R7 — Повний прогін гейтів Jekyll

Phase: 3 · Depends: JEK-R1..R6 · Repo: realtyua
Branch: `feat/JEK-R7-full-gates` · Worktree: `../worktrees/JEK-R7-full-gates`

Status: `done`

## Goal

Після JEK-R1..R6 (і JEK-R9) повний набір гейтів Jekyll на одному HEAD дає
очікуваний результат, а кожен факт зафіксований у handoff: `T`, `V`, `CA`,
`CN`, `VR` і підрахунок Leaflet на `/new.html`.

## Контекст

- JEK-R1..R6 закриті; перший прогін — на `38058edb`. Після JEK-R8 базовий
  HEAD — `705b7157` (`feature/form-engine`; гілку item-а fast-forward-нуто).
- R7 — контрольна точка перед Phase 4 (theme-neutral hooks). Item нічого не
  «лікує»: якщо гейт червоний, фіксуємо причину, і знахідка поза scope
  отримує новий ID.
- JEK-R8 (EOL-нормалізація) закритий комітом `1c35ef86` (merge `e33f7379`),
  тому `form-app-fresh` у свіжому worktree більше не падає.

## Files

- `docs/form-engine/items/JEK-R7.md` — spec + handoff (цей файл).
- `docs/form-engine/WORKITEMS.md` — рядок JEK-R7.
- `_form-engine/baseline/**` — свідомий re-capture 2026-11-06 (4 tracked
  артефакти; атрибуція кожної розбіжності — в handoff).
- `.gitattributes` — `_form-engine/baseline/** -text`, щоб checkout не
  переписував baseline у CRLF.

Не змінюються: `assets/js/form-engine/**`, `_form-engine/tools/**`,
`_data/**`, `_plugins/**`, `test/**`, `_includes/**`,
`.opencode/skills/**`.

## Steps

1. Worktree `JEK-R7-full-gates`, гілка `feat/JEK-R7-full-gates`
   (detached HEAD → `git checkout -b`).
2. Junction `node_modules` на `../../main/node_modules` (без `npm install`).
3. Baseline-гейти **до** будь-яких правок: `npm test`, три
   `validate-config --strict`, `check-add-property`.
4. `VR`: `verify-render.ps1 verify` — build `--limit_posts 1`, diff проти
   baseline, потім `check-notify.mjs` усередині wrapper-а.
5. `CN` окремо на зібраному `_site`.
6. Leaflet на `/new.html`: рівно один CSS-блок і один JS-блок у `_site`.
7. Записати матрицю результатів у handoff, оновити рядок у `WORKITEMS.md`.

## Acceptance

- `T`: тести зелені на свіжому worktree (або єдиний fail — відомий EOL-case
  JEK-R8, явно названий у handoff).
- `V`: 3/3 конфіги валідні (`add-property`, `notify`, `demo`).
- `CA`: `check-add-property` — PASS, 0 failures.
- `CN`: `check-notify` на `_site` — зелений.
- `VR`: `verify-render.ps1 verify` — без незапланованих diff; property-сторінка
  або збігається з baseline, або явно позначена як `NEW POST` (re-capture —
  окремий свідомий акт).
- `/new.html`: рівно один Leaflet CSS і один Leaflet JS.
- Змінені лише два doc-файли item-а + 4 файли `_form-engine/baseline/`
  (approved re-capture) + один рядок у `.gitattributes`.

## Gates

Планові гейти: `T`, `V`, `CA`, `CN`, `VR`.

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
node _form-engine/tools/check-notify.mjs _site
powershell -File _form-engine/tools/verify-render.ps1 verify
```

## Out of scope

- Виправлення EOL-проблеми (`.gitattributes`, freshness-тест) — JEK-R8.
- Будь-які зміни runtime, тем, тестів, `_data`, `_plugins`, `_includes`.
- Оновлення baseline `verify-render` — **погоджено пізніше** (Варіант A,
  сесія 2): re-capture після ручного розбору кожної розбіжності.
- Phase 7c (theme-neutral hooks) і доступність — JEK-E1..E4.
- `reifua` (11ty) — EL-*.

## Handoff log

- 2026-11-06: Item створено зі `_TEMPLATE.md` (файл був відсутній); spec
  показано користувачу до початку робіт. Репозиторій — `realtyua/main`, база
  `feature/form-engine`, HEAD `38058edb`, робоче дерево чисте. Усі залежності
  (JEK-R1..R6) — `done`; worktree item-а ще не існувало.
- 2026-11-06: Worktree `../worktrees/JEK-R7-full-gates`, гілка
  `feat/JEK-R7-full-gates` (detached HEAD → `git checkout -b`). Junction
  `node_modules` на `../../main/node_modules` (без `npm install`).
- 2026-11-06: Baseline/item-гейти:
  - **T** — `npm test` у worktree: 214 tests, **213 pass, 1 fail**
    (`test/form-app-fresh.test.mjs`, CRLF проти LF). У канонічному `main` на
    тому самому HEAD — **214/214**. Отже це відомий EOL-артефакт свіжого
    Windows-checkout (JEK-R8), а не регресія R7.
  - **V** — 3/3 valid: `add-property`, `notify`, `demo` (`--strict`).
  - **CA** — `check-add-property` **PASS**, 0 failures.
  - **CN** — `check-notify.mjs _site` — `ok (1 page(s) checked)`;
    той самий результат усередині VR-wrapper-а.
  - **VR** — `verify-render.ps1 verify` **FAIL 3/3**. Baseline
    `_form-engine/baseline/.render-baseline.json` має
    `capturedAt: 2026-10-17T14:45:41Z`, тобто знятий до Phase 3. Атрибуція:
    - `new.html` — після нормалізації bake-sha різниця лише в config
      island: апострофи в `pattern` (`'` → `’`) і `file.info*`
      (`infoMessage` → `validation` + `feedback`). Це post-baseline зміни
      JEK-R3/R4, не регресія рендера.
    - `assets/data/form-config.json` — ті самі config-зміни (deep diff
      збігається з `new.html`).
    - property-фрагмент — **байт-ідентичний** після вилучення одного
      `<script type="module" src="/assets/js/form-engine/app.js?v=...">`;
      це JEK-R9.
    Re-capture baseline — свідомий акт поза scope R7.
  - **Leaflet `/new.html`** — рівно 1 inline CSS-блок (12 057 симв.) і
    1 inline JS-блок (147 363 симв.), 0 зовнішніх leaflet-ассетів →
    JEK-R1 тримається.
- 2026-11-06: Побічний ефект build: `_includes/form/app/add-property.html`
  перепечено (`M` у git). Після нормалізації EOL + bake-sha + `app.js?v=`
  файл ідентичний HEAD; `gen-form-app.mjs` каже `unchanged`. Причина —
  EOL-чутливий `freshnessSha`/version (JEK-R8). Це не частина item-а;
  комітити не треба (за потреби: `git checkout -- _includes/form/app/add-property.html`).
- 2026-11-06: Змінено лише `docs/form-engine/items/JEK-R7.md` (spec + handoff)
  і `docs/form-engine/WORKITEMS.md` (рядок JEK-R7). Код, тести, baseline,
  `_data`, `_plugins`, `_includes`, `.opencode/skills/**` не редагувались.
- 2026-11-06: Статус — `blocked`: **T** червоний через JEK-R8 (EOL), **VR**
  червоний через застарілий baseline (потрібен re-capture після перегляду
  трьох розбіжностей). **V**, **CA**, **CN** і Leaflet-перевірка — зелені.
- 2026-11-06 (сесія 2, база `705b7157`): Item відновлено після JEK-R8.
  Гілку fast-forward-нуто на `705b7157`; рядок `blocked` у `WORKITEMS.md`
  відкочено, щоб ff пройшов (item-файл лишався untracked). Повторні гейти:
  - **T** — `npm test`: **214/214 pass, 0 fail**. EOL-блокер знято JEK-R8;
    `_includes/form/app/add-property.html` більше не перепікається.
  - **V** — 3/3 valid (`add-property`, `notify`, `demo`, `--strict`).
  - **CA** — `check-add-property` **PASS**, 0 failures.
  - **CN** — `check-notify.mjs _site` — `ok (1 page(s) checked)`.
  - **VR** — `verify` **FAIL 3/3** на baseline від 2026-10-17. Розбір кожної
    розбіжності (після нормалізації `?v=BUILD` і slice модалки):
    - `new.html` — sha island + 10 config-змін: 6 `pattern` (апостроф `'` →
      `’`, екранування `\-`) — JEK-R3; `file.infoLine` («однму» → «одному»),
      `file.infoMessage` → `validation` + `feedback` — JEK-R4. Після
      маскування sha+island лишається `.file-info` → `.file-preview-notice`
      у `<style>` — теж JEK-R4.
    - `assets/data/form-config.json` — ті самі 10 config-змін
      (fields 35/39/40/44, location 1–3).
    - property modal slice — після вилучення
      `<script type="module" src="/assets/js/form-engine/app.js?v=BUILD">`
      лишається один пробіл перед `</div>` (JEK-R9).
    Усі розбіжності — post-baseline зміни JEK-R3/R4/R9, не регресія рендера.
    Користувач погодив re-capture (Варіант A).
  - `verify-render.ps1 capture -SkipBuild` (свіжий `_site` того ж HEAD) →
    baseline перезаписано: `capturedAt: 2026-11-06T11:01:58.525Z`, 4 tracked
    файли. Потім `verify -SkipBuild` → **PASS: all 3 tracked file(s)
    byte-identical**.
  - **Leaflet `/new.html`** — 1 inline `<style>` (12 057 симв.), 1 inline
    `<script>` (147 363 симв.), 0 зовнішніх leaflet-ассетів → JEK-R1
    тримається.
- 2026-11-06: Знахідка поза початковим scope: `_form-engine/baseline/*.txt`
  не мали EOL-атрибутів при `core.autocrlf=true`, тож свіжий checkout віддавав
  CRLF і `verify` падав би без реальних змін (той самий клас, що JEK-R8).
  Користувач погодив фікс у цьому item-і: додано
  `_form-engine/baseline/** -text`; `git checkout-index` тепер дає LF,
  `verify -SkipBuild` — **PASS 3/3**.
- 2026-11-06: Статус — `done`: **T** 214/214, **V** 3/3, **CA** PASS,
  **CN** ok, **VR** PASS після approved re-capture, Leaflet 1/1/0.
- 2026-11-06: Закриття: item commit `dfda107e`, merge `--no-ff` `7969a1d7`;
  worktree і гілку видалено; `origin/feature/form-engine` = `7969a1d7`.
  На merged HEAD у канонічному `main` перепрогнано: **T** 214/214, **V** 3/3,
  **CA** PASS, **CN** ok, **VR** PASS 3/3 (повний build).
