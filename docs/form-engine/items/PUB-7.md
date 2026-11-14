# PUB-7 — `examples/jekyll` + `examples/eleventy`

Phase: 6 · Depends: PUB-6 · Repo: form-engine
Branch: `feat/PUB-7-examples` · Worktree: `../worktrees/PUB-7-examples`

Status: `todo`

## Goal

У пакеті `form-engine` з'являються два самодостатні, збирабельні приклади —
`examples/jekyll/` (тема Bootstrap 4) і `examples/eleventy/` (тема Tailwind) —
кожен з мінімальним демо-конфігом, адаптером і копією runtime. Сторонній
розробник клонує пакет, заходить у приклад, збирає його і бачить працюючу
форму без жодного рядка власного коду.

## Files

### Target (`form-engine/`)

**`examples/jekyll/`** — мінімальний Jekyll-сайт (розкладка, яку очікує
адаптер: `_form-engine/tools/` + `assets/js/form-engine/` + `_plugins/`):

- `README.md` — як зібрати (`bundle install`, `bundle exec jekyll serve`)
- `Gemfile` — `jekyll` (і `webrick` для Ruby ≥ 3)
- `.gitignore` — `_site/`, `.jekyll-cache/`, `Gemfile.lock`
- `_config.yml` — `baseurl: ''`, `demo_endpoint`, `turnstile_enabled: false`,
  курси `usd`/`eur`/`nbu`
- `_data/demo.yml` — демо-форма, `theme: bootstrap4`, кілька типів полів
  (text, select, checkbox, alert) — валідна за схемою
- `_data/uk.yml` — chrome-копія, яку читає `site-opts.mjs`
  (`previous`, `next`, `notify_submit`, `add_property_success`,
  `add_property_success_text`, `add_property_error_title`,
  `add_property_error_code`, `add_property_retry`, `close`)
- `_layouts/default.html` — мінімальний HTML-каркас
- `index.html` — лендінг зі посиланням на демо
- `demo.html` — сторінка з `{% include form/app/demo.html %}`
- `_includes/css/leaflet.css`, `_includes/js/leaflet.js` — **лише якщо** демо
  має `widget: map`; інакше не додаємо
- `_includes/form/app/.gitkeep` — тека для запеченого фрагмента (generated)
- `_plugins/form_engine.rb` — копія `adapters/jekyll/_plugins/form_engine.rb`
- `_form-engine/tools/` — копія `adapters/jekyll/tools/*` (bake, validate,
  gates, `yaml.mjs`, `site-opts.mjs`)
- `assets/js/form-engine/` — копія `runtime/**` (entry `app.js`)

**`examples/eleventy/`** — мінімальний 11ty-сайт (розкладка, яку очікує
адаптер: `lib/form-engine.js` + `src/assets/js/form-engine/`):

- `README.md` — як зібрати (`npm install`, `npx @11ty/eleventy`)
- `package.json` — `@11ty/eleventy`, `js-yaml`
- `.gitignore` — `node_modules/`, `dist/`
- `.eleventy.js` — passthrough-copy runtime, `require('./lib/form-engine')`
- `lib/form-engine.js` — копія `adapters/eleventy/lib/form-engine.js`
- `src/_data/demo.yml` — демо-форма, `theme: tailwind`
- `src/_data/site.js` — `demoEndpoint`
- `src/_includes/layouts/default.njk` — мінімальний каркас
- `src/index.njk` — лендінг
- `src/demo.njk` — сторінка з `{% formApp "demo" %}`
- `src/assets/js/form-engine/` — копія `runtime/**`

### Не змінюється

- `runtime/**`, `adapters/**`, `schema/**`, `tools/**`, `package.json`,
  `LICENSE`, `NOTICE`, `README.md`, `CHANGELOG.md`
- усі наявні `test/**` — окрім нового `test/examples.test.mjs` (див. Gates)

## Steps

1. Worktree від `master` репозиторію `form-engine`:
   `worktree_create "PUB-7-examples"` (створюється в **detached HEAD**).
2. Усередині worktree: `git checkout -b feat/PUB-7-examples`.
3. Junction на канонічний `node_modules`:
   `cmd /c mklink /J node_modules ..\..\main\node_modules` (без `npm install`).
   Зняти **до** `worktree_remove`.
4. Baseline gates **до** змін: `npm test` (очікувано 176/176),
   `node tools/validate-config.mjs` на трьох наявних конфігах — зафіксувати.
5. `examples/jekyll/`:
   - скопіювати `runtime/**` → `examples/jekyll/assets/js/form-engine/`;
   - скопіювати `adapters/jekyll/tools/*` → `examples/jekyll/_form-engine/tools/`;
   - скопіювати `adapters/jekyll/_plugins/form_engine.rb` →
     `examples/jekyll/_plugins/form_engine.rb`;
   - написати `_config.yml`, `_data/demo.yml` (`theme: bootstrap4`),
     `_data/uk.yml`, `_layouts/default.html`, `demo.html`, `index.html`,
     `README.md`, `Gemfile`, `.gitignore`.
6. `examples/eleventy/`:
   - скопіювати `runtime/**` → `examples/eleventy/src/assets/js/form-engine/`;
   - скопіювати `adapters/eleventy/lib/form-engine.js` →
     `examples/eleventy/lib/form-engine.js`;
   - написати `.eleventy.js`, `src/_data/demo.yml` (`theme: tailwind`),
     `src/_data/site.js`, `src/_includes/layouts/default.njk`, `src/demo.njk`,
     `src/index.njk`, `README.md`, `package.json`, `.gitignore`.
7. `test/examples.test.mjs` — офлайн-гейт прикладів:
   - обидва `demo.yml` валідні за `schema/form-config.schema.json`;
   - Jekyll-приклад: `gen-form-app` запечує `demo.html` з маркером
     `form-bake name=demo` і рендерить `data-form-page`/`data-form="demo"`;
   - 11ty-приклад: адаптер з фейковим `eleventyConfig` реєструє `formApp`
     і повертає той самий фрагмент для `"demo"`;
   - жодних мережевих викликів, жодних `npm install`.
8. Гейти item (див. нижче).
9. Handoff у цей файл + рядок у `WORKITEMS.md` (Branch/Worktree/Status).

> **Розмір.** Item великий. Якщо не влізає в одну сесію — розділити на
> `PUB-7a` (Jekyll-приклад) і `PUB-7b` (11ty-приклад), кожен з власним
> worktree, як того вимагають «Правила» `WORKITEMS.md`.

## Acceptance

- `examples/jekyll/` і `examples/eleventy/` — самодостатні: кожен містить
  власну копію runtime і адаптера, жодних `../..` import-ів за межі прикладу.
- Обидва демо-конфіги валідні за схемою (`--strict`, без unknown-key).
- Jekyll-приклад запечує фрагмент і сторінка `demo.html` його include-ить.
- 11ty-приклад реєструє `{% formApp "demo" %}` і рендерить той самий фрагмент.
- `test/examples.test.mjs` зелений; `npm test` лишається зеленим.
- `runtime/`, `adapters/`, `schema/`, `tools/`, `package.json` не змінені.
- Жоден інший item не зачеплений.

## Gates

- **T** (наявний suite): `npm test` — мусить лишитися 176/176 (плюс нові).
- **V** (validate): `node tools/validate-config.mjs examples/jekyll/_data/demo.yml --strict`;
  `node tools/validate-config.mjs examples/eleventy/src/_data/demo.yml --strict`.
- **EX** (examples contract): `node --test test/examples.test.mjs`.
- **BJ** (Jekyll bake, локально без Ruby): з теки `examples/jekyll`
  `node _form-engine/tools/gen-form-app.mjs --name demo --data _data/demo.yml --out _includes/form/app/demo.html`.
- **B** (повні збірки Jekyll / 11ty): Ruby `bundle exec jekyll build` і
  `npx @11ty/eleventy` — повний прогін у CI (PUB-10); локально — за наявності
  встановлених залежностей, інакше зафіксувати як known-deferred.

```powershell
npm test
node tools/validate-config.mjs examples/jekyll/_data/demo.yml --strict
node tools/validate-config.mjs examples/eleventy/src/_data/demo.yml --strict
node --test test/examples.test.mjs
```

## Out of scope

- `README.md` пакета + getting started — PUB-8.
- Config reference, theming, migration — PUB-9.
- CI (Node + Ruby + 11ty build + parity) і реліз `1.0.0` — PUB-10.
- Будь-які зміни в `runtime/`, `adapters/`, `schema/`, `tools/`, `package.json`.
- Наповнення прикладів реальним контентом/стилями realty.ua чи reifua.

## Handoff log

- **2026-11-14**: status `review` — examples scope done in `form-engine` worktree
  `X:/OpenCodeData/opencode/worktree/247de9/PUB-7-examples`, branch
  `feat/PUB-7-examples` (junction to canonical `node_modules` created, removed
  before worktree cleanup).

  Files changed:
  - `examples/jekyll/` (31 files): `_config.yml` (added `exclude:` list),
    `_data/demo.yml` (`theme: bootstrap4`), `_data/uk.yml`, `demo.html`,
    `index.html`, `_layouts/default.html`, `README.md` (added `js-yaml` note),
    `Gemfile`, `.gitignore`, `_plugins/form_engine.rb` (copy from adapter),
    `_form-engine/tools/{gen-form-app.mjs,site-opts.mjs,validate-config.mjs,yaml.mjs}`,
    `_form-engine/schema/form-config.schema.json` (copy of package schema),
    `assets/js/form-engine/**` (24 runtime files, each with `package.json:
    {"type":"module"}`), `_includes/form/app/.gitkeep`.
  - `examples/eleventy/` (28 files): `.eleventy.js`, `lib/form-engine.js` (copy
    from adapter), `src/_data/demo.yml` (`theme: tailwind`),
    `src/_data/site.js`, `src/_includes/layouts/default.njk`,
    `src/index.njk`, `src/demo.njk`, `README.md`, `package.json`,
    `.gitignore`, `src/assets/js/form-engine/**` (24 runtime files with
    `package.json: {"type":"module"}`).
  - `test/examples.test.mjs` (7 tests: self-containment, `--strict` validation,
    theme/id checks, Jekyll bake contract, Jekyll page include, 11ty adapter
    with fake `eleventyConfig`, 11ty page shortcode).
  - Deleted: `examples/jekyll/.gitkeep`, `examples/eleventy/.gitkeep`.

  Gates:
  - **V** `validate-config --strict` on both demo configs: **2/2 valid**, no
    unknown keys.
  - **EX** `node --test test/examples.test.mjs`: **7/7 pass**.
  - **BJ** Jekyll bake (Node only): `gen-form-app.mjs` produces 16358-byte
    fragment with marker `<!-- form-bake name=demo sha=4d13e944... -->`,
    `data-endpoint="/api/demo"`, `data-form="demo"`, submit label from
    `_data/uk.yml`.
  - **B** full Jekyll build: `ruby ...\jekyll build` → "FormEngine: baked
    demo", `_site/demo.html` with form + `app.js?v=5166ac6f0f36` + Bootstrap
    link, `_site/index.html` links to `/demo.html`; `_site/README.md` not
    copied (exclude works).
  - **B** full Eleventy build: `npx @11ty/eleventy` (v3.1.5 from npx cache)
    → `dist/demo/index.html` with baked fragment, `app.js?v=...`, Tailwind
    theme; `dist/index.html` links to `/demo/`; 26 assets copied.
  - **T** `npm test`: **183/183 pass** (baseline 176 + 7 new examples tests).

  Deviations / notes:
  - Removed realtyua-site-specific tools copied from adapter
    (`check-add-property.mjs`, `check-notify.mjs`, `verify-render.mjs`,
    `verify-render.ps1`) — they reference nonexistent site files; kept only
    `gen-form-app.mjs`, `site-opts.mjs`, `validate-config.mjs`, `yaml.mjs`.
  - Added `_form-engine/schema/form-config.schema.json` in Jekyll example
    because copied `validate-config.mjs` reads it from that relative path.
  - Both runtime copies get `{"type":"module"}` `package.json` to silence
    `MODULE_TYPELESS_PACKAGE_JSON` warning and keep examples self-contained.
  - Jekyll `_config.yml` extended with explicit `exclude:` to prevent copying
    `README.md`/`Gemfile*` into `_site/`.
  - Jekyll `README.md` notes `js-yaml` is required for Node tools (present via
    junction; standalone needs `npm install js-yaml`).
  - All 73 example files + `test/examples.test.mjs` verified UTF-8 without BOM.
  - `runtime/`, `adapters/`, `schema/`, `tools/`, root `package.json` unchanged.
  - Tracked diff is only deletion of `examples/jekyll/.gitkeep` and
    `examples/eleventy/.gitkeep`.

  Leftovers / out of scope:
  - CI (PUB-10) will run Ruby + 11ty in pipeline.
  - `README.md` + getting started (PUB-8), config reference/theming/migration
    (PUB-9), release `1.0.0` (PUB-10).

  Commit SHA: (not committed; awaiting review).
