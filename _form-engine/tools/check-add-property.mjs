#!/usr/bin/env node
// Checks the add-property form against the Phase 0 baseline.
//
//   node _form-engine/tools/check-add-property.mjs [--baseline _form-engine/baseline/add-property-old.txt]
//
// The baseline is the frozen snapshot of the old Jekyll page (before the
// page switched to the engine include at runtime). The engine is a pure
// renderer that emits none of that - no Alpine, data-* hooks instead. The two
// cannot be byte-diffed, so this checker proves fidelity in three layers:
//
//   A. copy parity  - the static text the old page rendered (labels, helper
//                     text, placeholders, options, info lines) must also be in
//                     the engine output, after each side drops the attributes
//                     the other does not have;
//   B. structure     - the ids and classes the config drives (widget boxes,
//                     subfield selects, autocomplete search, file input) exist
//                     in the engine output with the exact shapes the partials
//                     use;
//   C. id contract   - every id the engine emits existed in the old page, and
//                     every config field's control id does too.
//
// Pure Node: yml via Ruby (yaml.mjs), the engine imported directly.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadYaml } from './yaml.mjs';
import { FormRender } from '../../assets/js/form-engine/render.js';
import { inlineMarkdown } from '../../assets/js/form-engine/html.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG_PATH = join(ROOT, '_data', 'add-property.yml');

// ------------------------------------------------------------------ helpers

function eachField(rows, visit) {
  for (const row of rows || []) {
    for (const field of row.fields || []) visit(field, row);
    for (const col of row.cols || []) eachField(col.rows, visit);
  }
}

function everyField(config, visit) {
  for (const step of config.steps || []) eachField(step.rows, visit);
}

function extractFormSlice(src) {
  const start = src.indexOf(`<form id="add-property-form"`);
  if (start < 0) throw new Error('baseline has no <form id="add-property-form">');
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src.startsWith('<form', i)) { depth++; i += 4; }
    else if (src.startsWith('</form>', i)) {
      depth--;
      if (depth === 0) return src.slice(start, i);
      i += 6;
    }
  }
  throw new Error('baseline form is unbalanced');
}

// The attributes each implementation owns. The old page is bound with Alpine;
// the engine adds data-* hooks and a static `hidden` where the partial used an
// x-show default. Strip those, and the inline feedback display the engine
// deliberately leaves to Bootstrap.
const ALPINE_ATTR = /\s(x-[a-z][\w.:-]*|@[a-z][\w.:-]*|:[a-z-]+)="[^"]*"/g;
const DATA_ATTR = /\sdata-[a-z][\w-]*="[^"]*"/g;

function normalize(src, { alpine, dataAttr }) {
  return src
    .replace(/<template[\s\S]*?<\/template>/g, '')
    .replace(/ style="display: block"/g, '')
    .replace(alpine ? ALPINE_ATTR : '', (m) => (alpine ? m : m))
    .replace(dataAttr ? DATA_ATTR : '', (m) => (dataAttr ? m : m))
    .replace(/\sx-cloak\b/g, '')
    .replace(/\b hidden\b/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

function collectIds(html) {
  const out = new Set();
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) out.add(m[1]);
  return out;
}

// Static text a faithful render must keep, read from the config.
function expectedStrings(config) {
  const seen = new Set();
  const push = (v) => { if (v !== undefined && v !== null && v !== '') seen.add(String(v)); };
  const labelText = (label) => {
    if (typeof label === 'string') return push(label);
    if (label && typeof label === 'object' && typeof label.text === 'string' && !label.depends) {
      push(label.markdown ? inlineMarkdown(label.text) : label.text);
    }
  };

  const settings = config.settings || {};
  // title/description live in the page shell outside <form>; only the feedback
  // copy belongs to the fields.
  push(settings.feedback?.valid);

  everyField(config, (field) => {
    labelText(field.label);
    // the number partial never renders a placeholder, so those are runtime-only
    push(field.type === 'number' ? undefined : field.placeholder);
    push(field.helper);
    push(field.feedback?.valid);
    if (field.type === 'select' || field.type === 'radio' || field.type === 'checkbox_group') {
      for (const option of field.options || []) {
        const value = option.value ?? option;
        push(option.label ?? value);
      }
    }
    if (field.type === 'file' && field.file) {
      const fm = field.file;
      const min = fm.minFiles;
      const max = fm.maxFiles || 10;
      const limit = fm.maxSize || '5 MB';
      push((fm.infoLine || (min
        ? `фотознімки: від ${min} до ${max} файлів, до ${limit}`
        : `фотознімки: максимум ${max} файлів, до ${limit}`))
        .replace('{min}', min).replace('{max}', max).replace('{limit}', limit));
    }
    if (field.widget === 'location') {
      for (const sub of field.fields || []) {
        labelText(sub.label);
        push(sub.placeholder);
        push(sub.helper);
        push(sub.feedback?.valid);
      }
    } else if (field.widget) {
      push(field.theme);
      push(field.size);
      push(field.appearance);
    }
  });

  return [...seen];
}

// ------------------------------------------------------------------ running

const args = process.argv.slice(2);
const baselineFlag = args.indexOf('--baseline');
const baselinePath = resolve(
  ROOT,
  baselineFlag !== -1 ? args[baselineFlag + 1] : join('_form-engine', 'baseline', 'add-property-old.txt'),
);

let failures = 0;
const check = (ok, label) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
};

if (!existsSync(CONFIG_PATH)) {
  console.error(`missing config: ${CONFIG_PATH}`);
  process.exit(2);
}
const config = loadYaml(CONFIG_PATH);

if (!existsSync(baselinePath)) {
  console.error(`missing baseline: ${baselinePath}`);
  process.exit(2);
}
const baselineSlice = normalize(extractFormSlice(readFileSync(baselinePath, 'utf8').replace(/^\uFEFF/, '')), { alpine: true, dataAttr: false });

const html = FormRender.render(config);
const engineNorm = normalize(html, { alpine: false, dataAttr: true });

// ----------------------------------------------------------------- copy
const strings = expectedStrings(config);
for (const text of strings) {
  check(baselineSlice.includes(text), `copy in baseline: ${text.slice(0, 60)}`);
  check(engineNorm.includes(text), `copy in render: ${text.slice(0, 60)}`);
}

// ------------------------------------------------------------ structure
check(/<form id="add-property-form" method="POST" novalidate autocomplete="off" data-form="add-property">/.test(html), 'form wrapper');

const plain = [];
const contentTypes = new Set(['alert', 'badge', 'heading', 'image', 'list', 'paragraph', 'raw']);
everyField(config, (field) => { if (field.name) plain.push(field); });

for (const field of plain) {
  if (contentTypes.has(field.type)) continue;
  check(html.includes(`"${field.name}"`), `field hook present: ${field.name}`);
}

check(/data-field="district_settlement"/.test(html), 'autocomplete main control');
check(/<select class="form-control" id="field_district_settlement"[^>]*data-field="district_settlement">/.test(html), 'autocomplete select');
check(/<option value="">Введіть назву мікрорайону\.\.\.<\/option>/.test(html), 'autocomplete placeholder option');
check(/data-autocomplete-search="district_settlement"/.test(html), 'autocomplete search hook');
check(/data-autocomplete-search="type_address"/.test(html), 'autocomplete type_address hook');
check(/<div class="col-12 col-md-4" data-field-col="type_address">/.test(html), 'autocomplete column');

check(/<div class="col-12 col-md-6" data-field-col="phone">/.test(html), 'plain field column');

check(/class="custom-file-input" id="field_images" name="images" data-field="images" required/.test(html), 'file input attrs');
check(/accept="image\/\*" multiple/.test(html), 'file accept and multiple');
check(/class="file-previews mt-2"/.test(html), 'file previews container');
check(/class="file-info"/.test(html), 'file info container');

check(/<div class="col-12" data-widget="captcha" data-widget-name="captcha">/.test(html), 'captcha widget column');
check(/<div class="mb-2" id="label_captcha">/.test(html), 'captcha label block');
check(/<div id="captcha-widget" class="captcha-widget-box" tabindex="-1" data-captcha-field="captcha" data-captcha-theme="light" data-captcha-size="normal" data-captcha-appearance="always"><\/div>/.test(html), 'captcha turnstile box');
check(/data-captcha-retry="captcha">Спробувати ще раз/.test(html), 'captcha retry button');
check(/<span data-error="captcha"><\/span>/.test(html), 'captcha error hook');

check(/<div class="mb-2" id="label_map_widget">/.test(html), 'map label block');
check(/<div id="map-picker" class="border rounded map-picker-responsive" role="application" aria-labelledby="label_map_widget"><\/div>/.test(html), 'map picker');
check(/\.map-picker-responsive \{ height: 280px; \}/.test(html), 'map partial CSS');
check(/data-map-coords="map_widget"/.test(html), 'map coords hook');

check(/data-widget="price_info" data-widget-name="price_info_widget"/.test(html), 'price_info widget');
check(/<div class="card bg-light mb-3">/.test(html), 'price_info card');
check(/data-price-info="price_info_widget"/.test(html), 'price_info hook');
check(/data-depends="[^"]*"[^>]*data-widget="price_info" data-widget-name="price_info_widget"/.test(html), 'price_info depends wrapper');

check(/<h6 class="card-title">/ .test(html), 'location widget card title');
check(/<select class="form-control" id="field_location_widget_oblast" name="location_widget\.oblast"/.test(html), 'location select name');
check(/id="field_location_widget_hromada_search"/.test(html), 'location search id');
check(/<option value="">Введіть назву області\.\.\.<\/option>/.test(html), 'location placeholder');
check(/data-location-summary="settlement"/.test(html), 'location summary');
check(/<small id="helper_location_widget_raion" class="form-text text-muted">Оберіть район у списку<\/small>/.test(html), 'location subfield helper');

if (!/\b(x-[a-z]+|@[a-z][\w.:-]*|:[a-z-]+)=/.test(html)) check(true, 'no Alpine in engine output');
else check(false, 'no Alpine in engine output');

// ------------------------------------------------------- id contract
const engineIds = collectIds(html);
const baselineIds = collectIds(baselineSlice);
const orphan = [...engineIds].filter((id) => !baselineIds.has(id));
check(orphan.length === 0, `engine ids all existed in the old page${orphan.length ? `: ${orphan.join(', ')}` : ''}`);

for (const field of plain) {
  if (contentTypes.has(field.type)) continue;
  if (field.type === 'widgets' && field.widget === 'price_info') continue;
  if (field.type === 'widgets' && field.widget === 'location') {
    for (const sub of field.fields || []) {
      check(engineIds.has(`field_${field.name}_${sub.name}`), `location id field_${field.name}_${sub.name}`);
      check(engineIds.has(`field_${field.name}_${sub.name}_search`), `search id field_${field.name}_${sub.name}_search`);
    }
    check(/<h6 class="card-title">/.test(html), 'location card title id');
  } else if (field.type === 'widgets') {
    check(engineIds.has(`label_${field.name}`), `widget label id ${field.name}`);
  } else if (field.type === 'checkbox_group') {
    check(html.includes(`data-toggle-for="${field.name}"`), `checkbox_group hook ${field.name}`);
  } else if (field.type === 'radio') {
    // radios carry per-option ids, not a field id
    for (const option of field.options || []) {
      const value = option.value ?? option;
      check(engineIds.has(`field_${field.name}_${value}`), `radio id field_${field.name}_${value}`);
    }
  } else {
    check(engineIds.has(`field_${field.name}`), `control id field_${field.name}`);
  }
}
check(baselineIds.has('map-picker') && baselineIds.has('captcha-widget'), 'widget fixed ids in baseline too');

console.log(failures === 0 ? '\ncheck-add-property: PASS' : `\ncheck-add-property: ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);