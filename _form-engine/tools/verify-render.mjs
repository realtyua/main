#!/usr/bin/env node
// Capture or compare the build output of the pages that must never change
// unexpectedly. Run through verify-render.ps1, which does the Jekyll build.
//
//   node _form-engine/tools/verify-render.mjs capture   # write _form-engine/baseline/
//   node _form-engine/tools/verify-render.mjs verify    # diff _site/ against _form-engine/baseline/
//
// Fast-limit mode: property pages are posts (region/city/.../_posts/*.md),
// and a full build renders all 1428 of them - over fifteen minutes. The
// baseline therefore comes from a `--limit_posts 1` build, which renders only
// the newest post. Which page that is changes whenever a newer listing
// appears, so capture records the discovered path in
// _form-engine/baseline/.render-baseline.json and verify reads it back instead of
// hardcoding a filename. When a newer post takes over, verify reports the
// swap and asks for a re-capture; it never adopts a new page on its own.
//
// The two always-built artifacts (new.html and the worker manifest) are
// static entries; the property modal is checked as a sliced fragment, because
// _includes/property/price-name.html picks an SEO synonym with Liquid's
// `sample` filter - every property page differs from every other by design.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = join(ROOT, '_site');
const BASELINE = join(ROOT, '_form-engine', 'baseline');
const MANIFEST = join(BASELINE, '.render-baseline.json');

// new.html renders the add-property form. form-config.json is the manifest the
// add-property Worker reads for server-side validation, so it has to stay in
// step with the YAML.
const STATIC_TRACKED = [
  { path: 'new.html', label: 'add-property form page' },
  { path: 'assets/data/form-config.json', label: 'add-property worker manifest' },
];

// The modal fragment: starts at the include's root element and stops at the
// next horizontal rule the layout puts after it.
const PROPERTY_SLICE = { from: '<div class="modal fade" id="notifyModal"', to: '<hr>' };

// A limit_posts 1 build carries exactly one property page. A capture from a
// full build would snapshot hundreds of near-identical listings, so anything
// above this means the build flags were wrong.
const FAST_BUILD_MAX_PAGES = 6;

// Everything here is allowed to drift between two builds of an unchanged tree.
const NORMALISERS = [
  // Jekyll stamps every asset with site.time, e.g. main.l.js?v=20260101120000
  [/\?v=\d+/g, '?v=BUILD'],
  // Front matter / template timestamps
  [/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/g, 'DATE'],
];

function normalise(text) {
  let out = text;
  for (const [pattern, replacement] of NORMALISERS) out = out.replace(pattern, replacement);
  return out;
}

function slice(text, entry) {
  if (!entry.from) return text;
  const start = text.indexOf(entry.from);
  if (start < 0) throw new Error(`marker not found: ${entry.from}`);
  const end = entry.to ? text.indexOf(entry.to, start) : -1;
  if (entry.to && end < 0) throw new Error(`end marker not found: ${entry.to}`);
  return text.slice(start, end < 0 ? undefined : end);
}

function htmlFiles(dir) {
  const out = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.html')) out.push(path);
    }
  };
  walk(dir);
  return out;
}

/** Every built page carrying the notify modal, as site-relative paths. */
function propertyPages() {
  if (!existsSync(SITE)) return [];
  return htmlFiles(SITE)
    .filter((file) => readFileSync(file, 'utf8').includes('id="notifyModal"'))
    .map((file) => relative(SITE, file).split(sep).join('/'))
    .sort();
}

function readEntry(entry) {
  const file = join(SITE, entry.path);
  if (!existsSync(file)) return null;
  try {
    return normalise(slice(readFileSync(file, 'utf8'), entry));
  } catch (err) {
    console.error(`  ERROR    ${entry.path}: ${err.message}`);
    process.exitCode = 1;
    return null;
  }
}

const backupName = (path) => `${path.replace(/[\\/]/g, '__')}.txt`;

const mode = process.argv[2];
if (mode !== 'capture' && mode !== 'verify') {
  console.error('usage: node _form-engine/tools/verify-render.mjs capture|verify');
  process.exit(2);
}

if (mode === 'capture') {
  mkdirSync(BASELINE, { recursive: true });

  let failed = 0;

  for (const entry of STATIC_TRACKED) {
    const content = readEntry(entry);
    if (content === null) {
      console.error(`  MISSING  ${entry.path}  (${entry.label})`);
      failed++;
      continue;
    }
    writeFileSync(join(BASELINE, backupName(entry.path)), content, 'utf8');
    console.log(`  saved    ${entry.path}  (${content.length} chars)`);
  }

  const pages = propertyPages();
  if (!pages.length) {
    console.error('  MISSING  no property page carries the notify modal in _site/');
    failed++;
  } else if (pages.length > FAST_BUILD_MAX_PAGES) {
    console.error(
      `  BAD BUILD  ${pages.length} property pages found - capture expects a fast\n` +
        '             build: bundle exec jekyll build --limit_posts 1 --trace --profile',
    );
    failed++;
  } else {
    for (const path of pages) {
      const entry = { path, label: 'notify modal on a property page', ...PROPERTY_SLICE };
      const content = readEntry(entry);
      if (content === null) {
        console.error(`  MISSING  ${path}  (${entry.label})`);
        failed++;
        continue;
      }
      writeFileSync(join(BASELINE, backupName(path)), content, 'utf8');
      console.log(`  saved    ${path}  (${content.length} chars)`);
    }
    const manifest = {
      version: 1,
      mode: 'fast',
      capturedAt: new Date().toISOString(),
      buildFlags: '--limit_posts 1',
      propertyPages: pages,
    };
    writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`  saved    ${relative(ROOT, MANIFEST).split(sep).join('/')}`);
  }

  if (failed) {
    console.error(`\ncapture failed: ${failed} artifact(s) not captured`);
    process.exit(1);
  }
  console.log(`\nbaseline written to _form-engine/baseline/`);
  process.exit(0);
}

// ---------------------------------------------------------------- verify ----

if (!existsSync(BASELINE)) {
  console.error('no baseline yet. run: node _form-engine/tools/verify-render.mjs capture');
  process.exit(2);
}

let manifest = null;
if (existsSync(MANIFEST)) {
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch (err) {
    console.error(`cannot read ${MANIFEST}: ${err.message}`);
    process.exit(2);
  }
} else {
  console.error(
    'no .render-baseline.json next to the baseline - the property page entry is\n' +
      'missing. re-run capture from a fast build:\n' +
      '  bundle exec jekyll build --limit_posts 1 --trace --profile\n' +
      '  node _form-engine/tools/verify-render.mjs capture',
  );
  process.exit(2);
}

const tracked = [
  ...STATIC_TRACKED,
  ...((manifest && manifest.propertyPages) || []).map((path) => ({
    path,
    label: 'notify modal on a property page',
    ...PROPERTY_SLICE,
  })),
];

function firstDifference(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : n;
}

// The pages are minified into a couple of very long lines, so a line diff says
// nothing. Show a window around the first differing character instead.
function reportDifference(expected, actual, label) {
  const at = firstDifference(expected, actual);
  const from = Math.max(0, at - 100);
  const to = at + 160;
  console.error(`  CHANGED  ${label}`);
  console.error(`    first difference at char ${at} (len ${expected.length} -> ${actual.length})`);
  console.error(`      - ...${expected.slice(from, to).replace(/\s+/g, ' ')}...`);
  console.error(`      + ...${actual.slice(from, to).replace(/\s+/g, ' ')}...`);
}

let failed = 0;

for (const entry of tracked) {
  const target = join(BASELINE, backupName(entry.path));
  const content = readEntry(entry);

  if (content === null) {
    if (entry.from) {
      const current = propertyPages();
      if (current.length && !current.includes(entry.path)) {
        console.error(`  NEW POST  ${entry.path}  ->  ${current.join(', ')}`);
        console.error(
          '            a newer listing replaced the tracked property page;\n' +
            '            re-run capture to adopt it (verify never adopts on its own)',
        );
      } else {
        console.error(`  MISSING  ${entry.path}  -- build no longer produces this page`);
      }
    } else {
      console.error(`  MISSING  ${entry.path}  -- build no longer produces this page`);
    }
    failed++;
    continue;
  }
  if (!existsSync(target)) {
    console.error(`  NO BASE  ${entry.path}  -- re-run capture to adopt it`);
    failed++;
    continue;
  }
  const expected = readFileSync(target, 'utf8');
  if (expected === content) {
    console.log(`  ok       ${entry.path}  (${entry.label})`);
    continue;
  }
  failed++;
  reportDifference(expected, content, `${entry.path}  (${entry.label})`);
}

console.log('');
if (failed) {
  console.error(`FAIL: ${failed}/${tracked.length} tracked file(s) changed`);
  process.exit(1);
}
console.log(`PASS: all ${tracked.length} tracked file(s) byte-identical to baseline`);
