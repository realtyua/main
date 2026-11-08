# Smart FORM engine

A declarative form engine. A form is a YAML/JSON config; the engine renders it,
validates it and submits it. Nothing in the runtime knows about Jekyll,
Eleventy, Liquid or Nunjucks.

## Why the config is JSON-compatible

A form config is baked at build time into one self-contained page fragment: a
JSON config island plus the already-rendered form, chrome and modals. That keeps
one engine usable on any static-site generator and lets the page paint without a
fetch:

```
_data/form.yml --bake--> _includes/form/app/form.html  (island + chrome + form + loader)
                            |  {% include form/app/form.html %}
                            v
                         FormRender.mount()  -- binds the baked form in the browser
```

The JSON island is the contract. The YAML is the authoring convenience on top of
it, and the same bytes serve the browser and (for add-property) the worker.

## Layout

| Path | Purpose |
| --- | --- |
| `_form-engine/schema/form-config.schema.json` | The contract. JSON Schema draft-07. |
| `_plugins/form_engine.rb` | Jekyll post_read hook: finds referenced forms, validates, bakes. |
| `_form-engine/tools/gen-form-app.mjs` | Bakes one form into `_includes/form/app/<name>.html`. |
| `_form-engine/tools/site-opts.mjs` | Site opts: copy, rates, endpoint, inline assets, engine digest. |
| `assets/js/form-engine/app.js` | The single browser entry: discovers config islands, boots each. |
| `assets/js/form-engine/shell.js` | `renderPage()`: config + opts -> full page fragment. |
| `assets/js/form-engine/render.js` | `FormRender.render/mount/theme`. Pure function of config. |
| `assets/js/form-engine/page-form.js` | Page-form glue (`bootPage`): scoped chrome, theme nav, mount. |
| `assets/js/form-engine/modal-form.js` | Modal-form glue (`bootModal`): island -> render -> bind. |
| `assets/js/form-engine/data.js` | Pure config/data helpers shared by both glues. |
| `assets/js/form-engine/submit.js` | Payload builders + worker error-text maps. |
| `assets/js/form-engine/*.js` | Conditions, layout, validation, model, language, HTML helpers, modals. |
| `assets/js/form-engine/controller.js` | One live controller per form: data, errors, steps. |
| `assets/js/form-engine/binder.js` | DOM binder: input events in, validity out. |
| `assets/js/form-engine/captcha.js` | Turnstile loader/gate shared by the glues. |
| `assets/js/form-engine/themes/*.js` | Themes (bootstrap4, tailwind) + chrome/modals/navTokens. |
| `assets/js/form-engine/themes/*.css` | The engine skin of each theme, inlined by `shell.js`. |
| `assets/js/form-engine/themes/themeStyle.js` | Build-time CSS lookup used by `shell.js` (Node only). |
| `assets/js/form-engine/package.json` | Declares the engine's `.js` files as ESM (`{"type":"module"}`). |
| `_includes/form/app/<name>.html` | Baked page fragment included by a page (generated). |
| `assets/data/form-*.json` | Baked configs served to the browser (worker manifests etc.). |
| `_form-engine/tools/validate-config.mjs` | Config validator: a draft-07 subset in plain Node, no schema library. |
| `_form-engine/tools/check-notify.mjs` | Post-build gate for the config-driven Notify modal. |
| `_form-engine/tools/check-add-property.mjs` | Purity gate against the frozen old-page baseline. |
| `_form-engine/tools/verify-render.ps1` | Build-diff safety net (build + normalise + compare). |
| `_form-engine/tools/verify-render.mjs` | The comparison engine the wrapper drives. |
| `_form-engine/tools/yaml.mjs` | Shared YAML loader (`js-yaml`) used by the validator and tests. |
| `_form-engine/baseline/*` | Frozen old-page + rendered-output baselines for the gates. |
| `test/*.test.mjs` | `node --test` suites (214 tests). |

Underscore-prefixed directories are never published by Jekyll, so `_form-engine/`
holds sources and specs while `assets/` holds what the browser fetches.

## The config

```yaml
version: 1
id: add-property
settings: { ... }        # form-wide copy and defaults
steps:                   # ordered wizard steps
  - id: type
    title: ...
    rows:
      - class: row
        auto: true       # distribute fields across breakpoints
        fields: [...]
      - class: row
        cols:            # or an explicit column split
          - class: col-12
            rows: [...]
submit: { endpoint: ... }
```

`steps → rows → (cols → rows)* → fields` is the shape a renderer walks. `row`
accepts either `fields` or `cols`, which is why both exist in current configs.

### Copy and limits can depend on form state

This is the one idea that shapes the whole DSL. `min`, `max`, `pattern`,
`required` and `label` are not literals, they are *answers chosen by conditions*:

```yaml
min:
  text: Максимум 99 кімнат
  depends:
    - field: property_type
      values: [commercial, garage]
      text: Максимум 500 приміщень
```

A condition is `{field}` plus one of `values` (equality set), `value`
(comparison expression, e.g. `'>0'`) or `except`. `logic: and|or` combines
siblings, and `when:` gates a single entry. `text:` on a condition overrides the
enclosing copy for that branch.

## Validation

```bash
node _form-engine/tools/validate-config.mjs _data/add-property.yml
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
```

YAML is read by `_form-engine/tools/yaml.mjs` through `js-yaml`, so validation
runs in plain Node (Jekyll itself still loads `_data` with Ruby's `psych`). The
validator implements a small draft-07 subset directly; there is no schema
library and no build step, so the same check runs in CI or in an editor task.

`--strict` additionally reports keys the schema does not know. `field` is
deliberately open - it is the long tail of the DSL and grows per widget - so
that is where typos would otherwise hide silently.

## Tests

```bash
npm test
```

`package.json` is tracked. Its `test` script runs
`node --test --test-force-exit --test-timeout=60000 --test-concurrency=2
"test/*.test.mjs"`; `--test-force-exit` is required because the runtime keeps
open handles. The `.mjs` files are ES modules by themselves. A fresh clone needs
one `npm install` for the small dependency set (`js-yaml` for the config loader,
`linkedom` for the page-wire suites); there is no test framework or jsdom - the
DOM stubs are hand-built.

What is covered: condition evaluation, grid distribution, validation message
precedence, the HTML helpers and their escaping rules, the model index, the
renderer's output - including a test that no Alpine attribute reaches the page
- the binder's DOM wiring against a stub element tree, and the Notify parity
suite (the worker's `E_*` message map, the captcha gate, the counter and a
FormData-shaped payload). The add-property page adds a glue test against a
parsed DOM (`linkedom`), a parity test that mirrors `check-add-property.mjs`, and
a freshness test that compares the baked fragment with a fresh render.

## Safety net

```powershell
.\_form-engine\tools\verify-render.ps1 capture   # record the current build output
.\_form-engine\tools\verify-render.ps1 verify    # rebuild, fail on any diff
```

The build is a fast one: `bundle exec jekyll build --limit_posts 1 --trace
--profile` renders only the newest listing post instead of all 1428 (about
ninety seconds instead of fifteen minutes). Three artifacts are tracked:
`new.html` (the form page), `assets/data/form-config.json` (the manifest the
add-property Worker reads) and the notify-modal fragment of a real property
page.

Property pages are posts, so which one the fast build produces changes when a
newer listing appears. Capture records the discovered path in
`_form-engine/baseline/.render-baseline.json`; verify reads it back and, when a
newer post has taken over, reports `NEW POST` and asks for a re-capture. It
never adopts a new page on its own - adoption is a deliberate act.

After every build, `_form-engine/tools/check-notify.mjs` (also run by the wrapper)
asserts the Notify contract on **every** built property page, found by content
rather than by a hardcoded path: the mount element and endpoint, both JSON
islands parse, the uid matches the built filename, the `form-engine/app.js`
module is included and the legacy `notify.js` is not - and the config renders, in
node, into the legacy form contract (`id`, `novalidate`, `data-form`,
honeypot, hidden fields) with no Alpine attribute.

Two normalisations run before comparison, both unavoidable: `?v=\d+` cache
busting and ISO timestamps.

The property page is tracked **by fragment only**, not whole. See below.

## Notify smoke check

The gates prove the markup and the config; the flow itself is a five-minute
manual pass:

```bash
bundle exec jekyll serve --limit_posts 1 --host localhost --trace --profile
```

1. open the built property page (under `--limit_posts 1` that is
   `http://localhost:4000/district/town/kosiv/apartment/prodam-1789988154.html`)
2. click the notify trigger: the modal renders the config form - reason
   select, counter under details, three contact columns
3. submit empty: the reason select turns red and the form keeps `was-validated`
4. pick a reason, type `abc123` into details: red with the Ukrainian message;
   correct it: green, and the counter counts down from 256
5. submit: the captcha gate speaks first when Turnstile is unsolved, then the
   spinner, then the success message hides the field groups
6. reopen the modal: the form comes back (timestamp refreshed, error hidden)
7. DevTools → Network: one `POST` to the notify-worker endpoint with the
   reason, details, the hidden page fields, the honeypot and
   `cf-turnstile-response`

Then close with `npm test` - all suites green.

## Known warts in the v1 DSL

These are recorded, not fixed. Each would be a behaviour change, so they wait
for the renderer to be in place.

1. **`required` is overloaded.** `required` may be a boolean *or* a condition
   list meaning "required while these hold". A renderer needs one clear rule.
   v2 splits it into `required: true` plus `depends` plus `validation.required`.

2. **`validation.message` is dead.** `_data/add-property.yml` sets it on the
   house-number field; nothing reads `validation.message`. The fallback the
   renderer actually uses is the field-level `message` key. The schema accepts
   it only so existing configs validate.

3. **Property pages are non-deterministic by design.**
   `_includes/property/price-name.html` picks an SEO synonym with Liquid's
   `| sample` filter, so every property page differs on every build. Whole-page
   comparison would be pure noise, which is why only the notify fragment is
   tracked. Do not "fix" the baseline diff this causes by loosening the
   normaliser further.

4. **`type` is optional on composite sub-fields.** The location cascade omits it
   and its renderer picks a search input or a `<select>` from `mode`/`threshold`.
   A v2 renderer should be explicit here.

5. **The form-wide `pattern` reaches email as an attribute but not as a rule.**
   The partials emit `pattern="{{ f.pattern | default: settings.pattern }}"` for
   `text`, `tel` *and* `email`, while the validator exempts `email` so a Ukrainian
   address is not rejected by the form-wide Ukrainian-letters pattern. Both sides
   are correct as they stand - `novalidate` makes the attribute inert - but
   removing it would change rendered output, and obeying it would reject valid
   addresses. The theme reproduces the attribute.

6. **An unknown `compare` operator blocks the value.** `form-engine.js` starts
   from `pass = false` and has no `default` branch, so an operator nobody
   implements fails the rule rather than letting it through. Preserved on
   purpose: a typo in a config must not silently accept bad data. The schema only
   lists the six operators that are implemented.

7. **`settings.validation[defKey]` is a live fallback layer.** `getValidationMsg`
   reads it between the field copy and the hardcoded default. No current config
   sets it, but the legacy engine honours it, so the port does too - the renderer
   is meant to be a drop-in for configs written against that engine.

## Migration status

| Phase | Scope | State |
| --- | --- | --- |
| 0 | Build-diff safety net | done |
| 1 | Schema freeze + validator | done |
| 2 | `form-render.js`, Bootstrap 4 theme, controller | done |
| 3 | Notify form onto the new engine | done |
| 4 | Fix multi-form and server-error defects | done |
| 5 | add-property, verified against the Phase 0 baseline | done |
| 6a | add-property page onto the new engine | done |
| 6b | Shared build-time shell (`form-engine/shell.js`, plugin, site-opts) | done |
| 6 | Tailwind theme | done |
| 7a | One browser entry + shared glue (`app.js`, `page-form`, `modal-form`, `data`, `submit`) | done |
| 7b | Config-driven worker copy (`submit.errors` overrides the built-in map) | done |
| 7c | Theme-neutral DOM hooks (drop the tailwind `.form-group` crash) | done (JEK-E1/E2, crash closed in 7a/7b) |
| 3 | Jekyll readiness (JEK-R1..R9): Leaflet, notify URL, copy triage, file-info, dead code | done |
| 4 | Jekyll engine (JEK-E1..E5): theme-neutral hooks, Bootstrap4 parity, accessibility, full build+docs | **in progress (E5)** |
| 6 | port to the Eleventy site | pending |

Phase 3 closed the gaps between the engine and the live Jekyll site. JEK-R1
de-duplicated Leaflet on `/new.html`; JEK-R2 restored `url` in `_config.yml`, so
canonical/OG links and the notify island's `property_url` are absolute; JEK-R3
recorded the 13 reviewed Ukrainian copy edits as an explicit allow-list in
`check-add-property.mjs` while the baseline stays frozen; JEK-R4 made the gate
assert the absence of the Alpine-only `.file-info` slot, so the gate is now
**PASS with 0 failures**; JEK-R5 removed the legacy `_includes/form/**`
partials, the duplicate notify include, the orphan baked notify fragment and the
`php`/`python` copies - `_includes/form/` holds only `app/add-property.html`;
JEK-R9 loads the engine module on property pages and no longer ships
`notify.js`. JEK-R8 is still open: the repository has no `.gitattributes`, so a
Windows checkout can fail the baked-fragment freshness test on CRLF-vs-LF until
the EOL work lands.

Phase 2 renders `config → HTML` and is covered by tests; Phase 3 made the
result live. The instance controller tracks data, errors and steps per form -
one instance per form, no module-level `fieldsCache`, and
`clientErrors`/`serverErrors` kept apart instead of overwriting each other
(the two places the legacy engine clobbered them: form-engine.js:688,710 and
add-property.html:2599). `assets/js/form-engine/binder.js` bridges it to the
DOM: input events become `controller.setData`, and controller notifications
become the Bootstrap class contract (`.is-valid`/`.is-invalid`, the
`[data-error]` span, required markers, clear buttons, step switching) - with
`query`/`listen` injectable so the tests run against a stub instead of jsdom.

The Notify modal is the first consumer: `_data/notify.yml` carries the form,
the modal partial injects it as a JSON island plus the page values, and
`assets/js/form-engine/modal-form.js` renders, binds and submits it, keeping the legacy
submit flow (captcha gate, `E_*` message map, spinner, retry) verbatim. The
DOM-swap is atomic: the `notify.js` include left `java-script.html` in the
same change that added the module, so no page can double-submit.

Phase 4 hardened the two defect classes instead of patching the legacy file that
Phase 5 retires. The controller already kept instance state and separate
`clientErrors`/`serverErrors`; it now also announces `validateStep` /
`validateField` (a failed `next()` used to recompute errors and never tell the
binder, so nothing turned red), and `setServerErrors` treats a worker reply as a
complete report that **replaces** the server map instead of merging - a field the
server stops reporting must stop showing. Tests lock each guarantee at the DOM
level too: a server error renders and survives a client validation pass, editing
clears only that field's server error, and two forms bound on one page with
shared field names stay fully separate (the module-level `fieldsCache` defect,
now proven dead by test).

The theme deliberately emits no Alpine attributes. The Liquid partials bind with
`x-model` / `x-show` / `:class`; leaving them out is what lets the same markup
run on the Eleventy site, which has no Alpine, and it is why Phase 5 compares
against the Phase 0 baseline rather than a byte-identical copy of the partials.

Phase 5 closed the renderer's coverage gap: `autocomplete`, `file` and the four
widgets (`captcha`, `map`, `location`, `price_info`) were ported into the
Bootstrap 4 theme with their partial markup verbatim minus Alpine, the file
control getting `noId` (its id is hardcoded in the partial) and the widgets a
`widgetShell` wrapper carrying the `data-widget` hooks. A new gate,
`node _form-engine/tools/check-add-property.mjs`, proves parity against the Phase 0 baseline
in pure Node (no Jekyll, no browser): 159 config strings appear in both the old
form slice and the new render, the widget ids/classes for every field exist,
every engine id existed in the old page, and no Alpine attribute reaches the
render. The gate knows the quirks a port must not heal: the number partial never
renders `placeholder`, checkbox groups and radios carry no plain control id, and
the location widget prints its title as an `<h6>` rather than a label block.

add-property is migrated **last**: it is the only form with traffic, and its
baseline is what proves the new engine renders the old one identically.

Phase 6a moved the add-property **page** onto the instance glue. The old page
rendered every field through `_includes/form/render.html` with Alpine bindings;
the new one bakes the config as a JSON island (steps + settings + rates, no
copy strings - the UI copy lives in the theme and the message map exactly as it
did), mounts `#add-property-app` into the Bootstrap 4 theme, and moves the
wizard chrome, the buttons and the success/error blocks to plain Liquid with
`data-*` hooks - all siblings of the mount element, because `FormRender.mount`
replaces that element's contents. `assets/js/form-engine/page-form.js` (the page
glue, `bootPage`, helpers in `data.js`/`submit.js`) wires the parity suite's pure helpers to
the DOM: step navigation, `fieldError`-driven validity styling, the file
previews, the autocomplete/location cascade, the map and the captcha - the
legacy submit flow (validate → location → captcha → photos → FormData →
`add_property_endpoint`) verbatim, with the `E_*` worker codes mapped to the
`_data/uk.yml` strings it already had. `java-script.html` swapped the legacy
`form-engine.js` + Alpine script pair for the module, keeping the inline
Leaflet. The worker manifest and the property-page modal are untouched, so the
Phase 0 safety net still holds two ways: `check-add-property.mjs` compares the
engine render against a **frozen** snapshot of the old page
(`_form-engine/baseline/add-property-old.txt`, so the new page's re-captured baseline
cannot feed it), and `verify-render` tracks the new page byte-for-byte. The
module boots with the same DOMContentLoaded guard as the modal glue, and the
bundle runs only where a config island exists - no Alpine anywhere.

> **Copy drift, resolved:** the frozen baseline keeps the Phase 0 text while
> `_data/add-property.yml` moved to Ukrainian typography (`’`, `«»`, `м²`) and
> fixed wording. JEK-R3 records those 13 edits as an explicit allow-list in
> `check-add-property.mjs`, so the baseline remains a proof of the old page and
> a new or changed string still fails. JEK-R4 replaced the stale `.file-info`
> assertion with an explicit "must not exist" contract. The gate reports
> **PASS, 0 failures** (`node _form-engine/tools/check-add-property.mjs`).

The second theme proves the framework split clean. `form-engine/themes/tailwind.js`
is the full functional sibling of the Bootstrap one: `FormRender.render` exposes
it as `{ theme: 'tailwind' }`, and it emits the same ids, names, steps, `data-*`
hooks and `data-depends` wiring, restyled with utility classes. The Bootstrap
grid tokens the config carries (`col-12 col-md-6`, `offset-md-3`) are translated
to Tailwind widths (`w-full md:w-1/2`, `md:ml-1/4`) at render time; spacing
utilities the two frameworks share pass through. The class hooks the page glue
selects by name - `custom-file`, `custom-file-label`, `dropdown-menu`,
`dropdown-item`, `alert`/`alert-info`, `file-previews`, `mt-2` - are
kept next to the utilities, because the page scripts and the page CSS reach for
them, so the same controller/binder/glue run against either theme unchanged.
`bindForm` now takes `opts.classes` to rename the invalid/valid classes a theme
reacts to (a Tailwind page can pass `{ invalid: 'border-red-500', valid:
'border-green-500' }`); the default is still `is-invalid`/`is-valid`, so nothing
already bound changes. The parity suite `test/render-tailwind.test.mjs` asserts
the tailwind output carries every id and every data hook the bootstrap render
has, keeps the glue hooks, and contains none of the bootstrap utilities. The
theme changes nothing in `_site/` until the Eleventy page makes it the default.

The page shell moved out of Liquid. `_includes/form/app/shell.html`,
`_includes/form/modals.html`, `_includes/form/modal.html` and the old
`<name>-app.inc.html` wrapper are gone. `assets/js/form-engine/shell.js` renders the
whole fragment - config island, captcha, inline map/engine CSS, wizard chrome,
the form, addon modals, the module loader - as one pure string, and the theme
supplies the chrome and the modals (`theme.chrome`, `theme.modals`) so the page
and the fields share one theme. `_form-engine/tools/site-opts.mjs` supplies the site-wide
values (copy, currency rates, endpoint, inline Leaflet/style, and the engine
digest used as the `?v=` token); the config itself stays site-agnostic. On every
Jekyll build `_plugins/form_engine.rb` finds the forms a page opts into via
`{% include form/app/<name>.html %}`, validates each, and runs
`_form-engine/tools/gen-form-app.mjs`, which writes the fragment with a freshness marker
`<!-- form-bake name=<name> sha=<sha256> -->` and is a no-op write when nothing
changed (so `jekyll serve` cannot loop). The generator refuses to emit a Liquid
delimiter, because the fragment is rendered as Liquid by Jekyll. The page glue
scopes its chrome lookups to `#<name>-page` (fallback: the document), reads nav
colours from `config.chrome.nav` (fallback: the Bootstrap tokens), and toggles
the error-code block through the `hidden` property rather than a `d-none` class
(the attribute used to win, so a worker code was never shown). The same
generator and shell are what the Eleventy port will call.

## Phase 4 — Jekyll engine (JEK-E1..E5)

| Item | Scope | State |
| --- | --- | --- |
| JEK-E1 | Theme-neutral hooks audit (no code changes) | done |
| JEK-E2 | Theme-neutral hooks implementation (G-1..G-6, G-8) | done |
| JEK-E3 | Bootstrap4 render parity tests (Tailwind wire + theme-render parity) | done |
| JEK-E4 | Accessibility: labels, aria, focus, keyboard | done |
| JEK-E5 | Full build + docs (this item) | in progress |

**JEK-E1** (audit): Found 8 gaps (G-1..G-8). G-1 = map fallback visible in Tailwind (only visible UI defect). No blockers. Details: `docs/form-engine/theme-neutral-hooks.md`.

**JEK-E2** (implementation): G-1..G-6, G-8 fixed. Added `data-map-fallback`, `data-location-summary-panel`, `data-step-indicator`, `theme.validationClasses`. Removed Bootstrap utilities from glue DOM (`img-fluid`, `d-flex`, `align-items-center`, `justify-content-center`, `bg-light`, `text-muted`, `position-absolute`, `text-muted small`, `searchable-dropdown-item`). `.show` toggle removed. `T` 215/215, `V` 3/3, `CA` PASS, `VR` PASS after manual review + baseline recapture.

**JEK-E3** (Bootstrap4 parity tests): Added `theme-render-parity` + `theme-wire-parity` (Tailwind now passes booted `add-property`). Glue selector table, autocomplete, G-1 map fallback, location summary, local captcha all parity-verified. Aligned `BOOTSTRAP_TOKENS`/`HOOK_TOKENS` (`alert-info` = widget hook for captcha). `T` 228/228.

**JEK-E4** (accessibility): Both themes now have accessible names on every control, `fieldset`/`legend` for radio groups, `aria-label` on icon-only clear buttons, `aria-hidden` on decorative icons. `aria-invalid`/`aria-describedby` on validation, `role="combobox"` + `aria-expanded`/`aria-activedescendant` + `role="option"` on dropdowns, `aria-current="step"` on current step, live regions for errors/success/map-fallback/captcha. Focus management: step titles after next/prev, error/success blocks after submit. Keyboard activation of dropdown items (Enter/Space). `test/accessibility.test.mjs` added (12 tests, both themes). `T` 228/228.

**JEK-E5** (this item): Full Jekyll build, docs sync (`README.md`, `theming.md`), baked fragment refresh, `verify-render` baseline recapture, all gates green.

---

## One entry, one glue

The per-form module files are gone. `assets/js/form-engine/app.js` is the only
browser entry: it reads every `script[type="application/json"][id$="-config"]`
island, takes the mode from `config.behavior.mode` (`page` by default, `modal`
for the Notify modal) and calls `bootPage` or `bootModal`. The two glues share
`data.js` (pure config/data helpers) and `submit.js` (payload builders plus the
worker error maps), so the page and the modal left their former
`form-add-property.js`/`form-notify.js` files behind. `_includes/java-script.html`
loads `app.js` once; `assets/js/form.js`, `form-page.js`, `form-render.js` and
the old `form-shell.js` no longer exist.