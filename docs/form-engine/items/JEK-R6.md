# JEK-R6 — `_form-engine/README.md`: актуальний статус

Phase: 3 · Depends: JEK-R1..R5 · Repo: realtyua
Branch: `feat/JEK-R6-readme-status` · Worktree: `../worktrees/JEK-R6-readme-status`

Status: `review`

## Goal

`_form-engine/README.md` описує поточний стан рушія після JEK-R1..R5 (+R9), а
не стан на момент `178afaf8`: жодних застарілих чисел тестів, «13/14 failures»
у `check-add-property`, тверджень про відсутній `package.json` чи «no npm
install», і жодних згадок видаленого legacy-шару як живого.

## Контекст

README доданий у `178afaf8` і відтоді не змінювався; гейти й реєстр пішли
далі. Розбіжності, знайдені на HEAD `6c796c30`:

| Рядок README | Зараз у репо | Джерело істини |
| --- | --- | --- |
| `test/*.test.mjs` — «191 tests» (53) | 214 тестів у 16 файлах | `npm test` |
| «Run it as a plain command rather than `npm test`» + «`.gitignore` keeps `package.json` out» (121–124) | `package.json` трекнутий: `type: module`, scripts `test`/`validate`, deps `js-yaml`, `linkedom`, `iconv-lite`; тести імпортують `linkedom` | `package.json`, `.gitignore`, OC-5 |
| «no npm install step… YAML is parsed by Ruby's `psych`» (107–109) | валідатор читає YAML через `_form-engine/tools/yaml.mjs` (`js-yaml`), psych лишається лише в Jekyll-плагіні | `validate-config.mjs`, `yaml.mjs` |
| «Known drift: `check-add-property.mjs` reports 13 failures» (327–332) | **PASS, 0 failures**: JEK-R3 додав alias-таблицю 13 прийнятих copy-правок, JEK-R4 замінив `file-info` на явний негативний контракт | `check-add-property.mjs`, JEK-R3/R4 |
| Layout-таблиця без `verify-render.mjs`, `yaml.mjs`, `language.js`, `themes/themeStyle.js` | файли існують і беруть участь у build/гейтах | `_form-engine/tools/**`, `assets/js/form-engine/**` |
| Migration status: лише Phase 0–7c і «port to Eleventy pending» | Phase 3 (JEK-R1..R9) виконана, але не відображена: Leaflet dedup, `url`/`property_url`, copy-тріаж, `file-info`, видалення legacy-шару, `app.js` на property-сторінках | `WORKITEMS.md`, JEK-R1/R2/R3/R4/R5/R9 |
| «Then close with `node --test "test/*.test.mjs"`» (189) | канонічна команда — `npm test` з `--test-force-exit` | `package.json`, `gates.md` |

## Files

- `_form-engine/README.md` — оновити числа, команди, layout-таблицю,
  migration status і блок «Known drift».
- `docs/form-engine/items/JEK-R6.md` — цей файл (spec + handoff).
- `docs/form-engine/WORKITEMS.md` — рядок JEK-R6.

Не змінюються: `assets/js/form-engine/**`, `_form-engine/tools/**`,
`_form-engine/baseline/**`, `_data/**`, `_plugins/**`, `test/**`,
`.opencode/skills/**`.

## Steps

1. Worktree `JEK-R6-readme-status`, гілка `feat/JEK-R6-readme-status`
   (detached HEAD → `git checkout -b`).
2. Junction `node_modules` на `../../main/node_modules` (без `npm install`).
3. Baseline-гейти до змін: `npm test`, три `validate-config --strict`,
   `check-add-property` — зафіксувати факти для README.
4. Правки лише в `_form-engine/README.md`:
   - число тестів і канонічна команда `npm test`;
   - прибрати твердження про відсутній `package.json` / «no npm install»;
     описати `js-yaml`-лоадер і роль psych (Jekyll `_data`);
   - layout-таблиця: додати відсутні tools/runtime-файли;
   - migration status: додати Phase 3 (JEK-R1..R9) і актуальні залишки
     (7c, Eleventy);
   - блок «Known drift» замінити на поточний стан `check-add-property`:
     0 failures, alias-таблиця + `file-info`-контракт, baseline заморожений.
5. Гейти після змін: ті самі T/V/CA — числа в README мають збігатися.
6. Handoff + оновити рядок у `WORKITEMS.md`.

## Acceptance

- У README немає чисел/тверджень, які суперечать HEAD: тести — 214, 3/3
  конфіги, `check-add-property` — PASS (0 failures).
- README не каже, що `package.json` відсутній або що валідатор не має
  npm-залежностей.
- Layout-таблиця згадує наявні файли й не згадує видалений legacy-шар як
  робочий шлях.
- Migration status відображає Phase 3 (JEK-R1..R9) і чесно лишає pending
  Phase 7c та Eleventy.
- Зміни тільки в трьох файлах item-а; код, тести, baseline, `_data`
  не змінені.

## Gates

Планові гейти: `—` (docs-only). Для перевірки фактів, наведених у README:

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
```

`CN` потребує зібраного `_site`; повний прогін `VR`/`CN` — JEK-R7.

## Out of scope

- Повний прогін усіх гейтів Jekyll — JEK-R7.
- Застарілі «14 failures» у `.opencode/skills/form-engine/references/gates.md` —
  окрема знахідка (не цей item).
- Застарілий header-коментар у `_form-engine/tools/validate-config.mjs`
  («no npm dependencies», psych) — окрема знахідка.
- Будь-які зміни runtime, тестів, baseline, `_data`, `_plugins`.
- `reifua` (11ty) — EL-*.
- Phase 7c (theme-neutral hooks) і доступність — JEK-E1..E4.

## Handoff log

- 2026-11-05: Item створено зі `_TEMPLATE.md` (файл був відсутній).
  Репозиторій: `realtyua/main`, гілка `feature/form-engine`, HEAD `6c796c30`,
  робоче дерево чисте; наявний лише канонічний worktree; worktree item-а ще не
  створено.
- 2026-11-05: Worktree `../worktrees/JEK-R6-readme-status`, гілка
  `feat/JEK-R6-readme-status` (detached HEAD → `git checkout -b`). Junction
  `node_modules` на `../../main/node_modules` (без `npm install`).
- 2026-11-05: Baseline-гейти **до** змін: `npm test` — 214 тестів, 213 pass,
  1 fail (`test/form-app-fresh.test.mjs`: baked-фрагмент CRLF проти LF у fresh
  render; відомий EOL-артефакт JEK-R8, не регресія); 3/3 конфіги valid;
  `check-add-property` — **PASS**, 0 failures.
- 2026-11-05: Оновлено лише `_form-engine/README.md` (+45/−20):
  - layout-таблиця: `language.js`, `themes/themeStyle.js`, `verify-render.mjs`,
    `yaml.mjs`; число тестів 191 → 214; validator описаний як draft-07 subset
    без schema-бібліотеки;
  - Validation: прибрано хибне «no npm install» / «psych парсить YAML»;
    зазначено `yaml.mjs` + `js-yaml`, psych лишається за Jekyll `_data`;
  - Tests: канонічна команда `npm test` (з `--test-force-exit`), трекнутий
    `package.json`, `js-yaml`/`linkedom`, відсутність jsdom; додано
    add-property wire/parity/freshness suites;
  - Notify smoke: `npm test` замість ручного `node --test`;
  - Migration status: рядок Phase 3 (JEK-R1..R9) + абзац про JEK-R1, R2, R3,
    R4, R5, R9 і відкритий JEK-R8;
  - «Known drift» замінено на «Copy drift, resolved»: 13 правок — explicit
    allow-list, `file-info` — негативний контракт, гейт PASS 0 failures.
- 2026-11-05: Гейти **після** змін ті самі: `npm test` — 214/213/1 (той самий
  EOL-fail JEK-R8); 3/3 конфіги valid; `check-add-property` — PASS.
  `_form-engine/README.md` і `docs/form-engine/items/JEK-R6.md` перевірені:
  UTF-8 без BOM, без U+FFFD.
- 2026-11-05: Код, тести, baseline, `_data`, `_plugins`, `.opencode/skills/**`
  не змінювались. Generated-файли не чіпались (build не запускався).
- 2026-11-05: Залишки (окремі знахідки, не цей item):
  `.opencode/skills/form-engine/references/gates.md` досі каже «14 failures»
  для `check-add-property`; header-коментар `_form-engine/tools/
  validate-config.mjs` каже «no npm dependencies» і psych. EOL-нормалізація —
  JEK-R8.
- 2026-11-05: Commit SHA: немає (агент не комітить; staging/commit/merge —
  користувач). Item готовий до рев'ю; статус — `review`.
- 2026-11-06: Сесію відновлено після переривання. Зміни на диску не втрачені:
  worktree `../worktrees/JEK-R6-readme-status`, гілка
  `feat/JEK-R6-readme-status`, `M _form-engine/README.md`,
  `M docs/form-engine/WORKITEMS.md`, `?? docs/form-engine/items/JEK-R6.md`.
  Гейти повторно прогнано: `npm test` — 214/213/1 (той самий EOL-fail JEK-R8);
  3/3 конфіги valid; `check-add-property` — PASS, 0 failures. Код не змінювався,
  commit не створювався. Статус лишається `review`.
