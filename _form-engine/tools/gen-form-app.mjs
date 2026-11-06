#!/usr/bin/env node
// Bakes one form into the ready-to-include page fragment.
//
//   node _form-engine/tools/gen-form-app.mjs
//   node _form-engine/tools/gen-form-app.mjs --name add-property --data _data/add-property.yml \
//        --out _includes/form/app/add-property.html
//   echo '{"name":"x","data":"_data/x.yml","out":"...","site":{...}}' \
//     | node _form-engine/tools/gen-form-app.mjs --stdin-json
//
// The output is the whole block a page includes - config island, wizard chrome,
// the rendered form, addon modals and the module loader (assets/js/form-engine/app.js)
// - so a page opts in with one line and no Liquid shell is involved:
//
//   {% include form/app/add-property.html %}
//
// Normally you do NOT run this by hand: _plugins/form_engine.rb bakes every
// referenced form on every Jekyll build. The Eleventy adapter does the same from
// .eleventy.js. Site-specific values (URLs, rates, copy, inline assets) come
// from _form-engine/tools/site-opts.mjs; the `site` key in the payload overrides them for a
// site whose data is not YAML.
//
// The output starts with a marker line:
//   <!-- form-bake name=<name> sha=<sha256 of config + site + engine> -->

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadYaml } from './yaml.mjs';
import { loadSiteOpts, freshnessSha } from './site-opts.mjs';
import { renderPage } from '../../assets/js/form-engine/shell.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--name') out.name = argv[++i];
    else if (a === '--data') out.data = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--sha') out.sha = argv[++i];
    else if (a === '--version') out.version = argv[++i];
    else if (a === '--stdin-json') out.stdinJson = true;
  }
  return out;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

const abs = (p) => (p && isAbsolute(p) ? p : resolve(ROOT, p || ''));

// The baked file is included by Jekyll, which renders Liquid inside every
// include. The fragment is meant to be literal HTML, so a stray `{{` or `{%`
// in a label would be silently interpreted (or break the build). Fail loudly at
// bake time instead, where the cause is one config away.
const LIQUID = /\{\{|\{%/;

const args = parseArgs(process.argv.slice(2));

let opts = args;
if (args.stdinJson) {
  const payload = JSON.parse(await readStdin());
  opts = { ...args, ...payload };
}

const name = opts.name || 'add-property';
const dataPath = abs(opts.data || join('_data', `${name}.yml`));
const outPath = abs(opts.out || join('_includes', 'form', 'app', `${name}.html`));

const sha = opts.sha || freshnessSha(ROOT, dataPath);

const config = loadYaml(dataPath);
const siteOpts = loadSiteOpts(ROOT, config, opts.site || {});
if (opts.version) siteOpts.version = opts.version;

// Generated files are committed with `.gitattributes` `-text`, so write the
// fragment as LF on every platform. A mixed-EOL bake would show up as a dirty
// working tree after every build on Windows.
const html = renderPage(config, { ...siteOpts, name }).replace(/\r\n/g, '\n');

const liquid = html.match(LIQUID);
if (liquid) {
  const at = html.indexOf(liquid[0]);
  throw new Error(
    `form "${name}" rendered a Liquid delimiter (${liquid[0]}) at char ${at}; ` +
      `the baked include is rendered as Liquid, so this would be interpreted. ` +
      `Escape it in the config.`,
  );
}

const baked = `<!-- form-bake name=${name} sha=${sha} -->\n${html.trimEnd()}\n`;

const rel = outPath.slice(ROOT.length + 1).replace(/\\/g, '/');

// The Jekyll plugin bakes on every build, and `jekyll serve` watches _includes:
// rewriting an identical file would bump its mtime and loop the watcher.
let current = null;
try {
  current = readFileSync(outPath, 'utf8');
} catch {
  current = null;
}
if (current === baked) {
  console.log(`unchanged ${rel}`);
} else {
  writeFileSync(outPath, baked, 'utf8');
  console.log(`wrote ${baked.length} chars to ${rel}`);
}
