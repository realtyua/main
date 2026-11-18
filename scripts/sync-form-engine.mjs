#!/usr/bin/env node
// Materialises the files a Jekyll site needs from the installed
// @realtyua/form-engine package.
//
// The package ships runtime/, adapters/jekyll/tools/ and schema/, while a
// Jekyll site expects them at assets/js/form-engine, _form-engine/tools and
// _form-engine/schema. Those three paths are generated (gitignored), not
// committed as copies, so the site always runs the installed package version.
//
//   npm install                # postinstall runs this automatically
//   npm run sync:form-engine   # or run it by hand

import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE = join(ROOT, 'node_modules', '@realtyua', 'form-engine');

const COPIES = [
  ['runtime', join('assets', 'js', 'form-engine')],
  [join('adapters', 'jekyll', 'tools'), join('_form-engine', 'tools')],
  ['schema', join('_form-engine', 'schema')],
];

if (!existsSync(join(PACKAGE, 'package.json'))) {
  console.error(
    `[sync-form-engine] @realtyua/form-engine is not installed at ${PACKAGE}.\n` +
      'Run `npm install` first.'
  );
  process.exit(1);
}

for (const [from, to] of COPIES) {
  const src = join(PACKAGE, from);
  const dest = join(ROOT, to);
  if (!existsSync(src)) {
    console.error(`[sync-form-engine] missing ${src}`);
    process.exit(1);
  }
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[sync-form-engine] ${from} -> ${to}`);
}
