import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadYaml } from '../_form-engine/tools/yaml.mjs';
import { loadSiteOpts } from '../_form-engine/tools/site-opts.mjs';
import { renderPage } from '../assets/js/form-engine/shell.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BAKED = join(ROOT, '_includes', 'form', 'app', 'add-property.html');

// EOL is not part of the baked contract. `.gitattributes` keeps the generated
// files LF on checkout, but an existing Windows worktree may still hand us CRLF
// until the attributes are re-applied, so normalize before comparing.
const normalizeEol = (text) => text.replace(/\r\n/g, '\n');

// The first line is the plugin's freshness marker: `<!-- form-bake ... -->`.
// Strip it so the comparison stays about the rendered markup only.
const stripMarker = (html) => normalizeEol(html).replace(/^<!--\s*form-bake\b[^>]*-->\s*\n?/, '');

test('the baked add-property page matches a fresh render of the config', () => {
  const config = loadYaml(join(ROOT, '_data', 'add-property.yml'));
  const fresh = renderPage(config, { ...loadSiteOpts(ROOT, config), name: 'add-property' });
  const baked = stripMarker(readFileSync(BAKED, 'utf8'));
  assert.equal(baked.trim(), normalizeEol(fresh).trim(),
    'stale server-side form - run `node _form-engine/tools/gen-form-app.mjs` and rebuild');
});

test('the baked page wraps exactly one mountable form', () => {
  const baked = stripMarker(readFileSync(BAKED, 'utf8'));
  assert.match(baked, /<div id="add-property-page" data-form-page>/);
  assert.match(baked, /<div id="add-property-app" data-endpoint="https:\/\/[^"]+">/);
  assert.match(baked, /<form id="add-property-form" method="POST" novalidate autocomplete="off" data-form="add-property">/);
  const count = (baked.match(/<\/form>/g) || []).length;
  assert.equal(count, 1, 'exactly one closing form tag');
});

test('the baked page carries the config island and the module loader', () => {
  const baked = stripMarker(readFileSync(BAKED, 'utf8'));
  assert.match(baked, /<script id="add-property-config" type="application\/json">/);
  assert.match(baked, /"theme":"bootstrap4"/);
  assert.match(baked, /<script type="module" src="[^"]*form-engine\/app\.js[^"]*"><\/script>/);
});

test('the baked file carries the freshness marker the plugin reads', () => {
  const baked = readFileSync(BAKED, 'utf8');
  assert.match(baked, /^<!-- form-bake name=add-property sha=[0-9a-f]{64} -->/);
});

test('the baked page contains no Liquid delimiters (it renders as Liquid)', () => {
  const baked = stripMarker(readFileSync(BAKED, 'utf8'));
  assert.doesNotMatch(baked, /\{\{|\{%/, 'a baked fragment must not contain Liquid tags');
});

test('the shared page CSS does not force feedback blocks open before validation', () => {
  const page = readFileSync(join(ROOT, 'assets', 'js', 'form-engine', 'themes', 'bootstrap4.css'), 'utf8');
  assert.doesNotMatch(page, /\.valid-feedback,\s*\.invalid-feedback\s*\{\s*display:\s*block/,
    'feedback visibility belongs to .is-valid/.is-invalid and the binder');
});
