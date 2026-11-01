// Everything a bake needs from the site, plus the digest that fingerprints it.
//
// A form config is deliberately site-agnostic: it does not carry URLs, currency
// rates, Ukrainian chrome copy or the inline Leaflet/style blobs. The adapter
// (the Jekyll plugin, the Eleventy plugin) is what knows them. For Jekyll that
// knowledge lives in _config.yml and _data/uk.yml, which this module reads
// directly - so a manual `node _form-engine/tools/gen-form-app.mjs` and the automatic build
// bake byte-identical output.
//
//   loadSiteOpts(root, config)     -> the `opts` renderPage() expects
//   engineFiles(root)              -> every engine file the bake depends on
//   engineDigest(root)             -> hash of those files (the ?v= token)
//   freshnessSha(root, dataPath)   -> hash of config + site + engine
//
// The Eleventy adapter, whose site data is not YAML, passes its own opts instead
// and never touches this file.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { loadYaml } from './yaml.mjs';

function optionalYaml(file) {
  if (!existsSync(file)) return {};
  try {
    return loadYaml(file) || {};
  } catch {
    return {};
  }
}

/**
 * The engine files a baked fragment depends on, as sorted root-relative POSIX
 * paths. Changing any of them must invalidate the bake: their bytes end up in
 * the fragment (style/map) or behind its `?v=` token (the modules).
 */
export function engineFiles(root) {
  const files = [];
  const walk = (dir, match) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full, match);
      else if (match(entry.name)) files.push(full);
    }
  };

  walk(join(root, 'assets', 'js'), (n) => /^form.*\.js$/.test(n) || n === 'captcha.js');
  walk(join(root, 'assets', 'js', 'form-engine'), (n) => n.endsWith('.js') || n.endsWith('.css'));
  for (const rel of ['_includes/css/leaflet.css', '_includes/js/leaflet.js']) {
    const full = join(root, rel);
    if (existsSync(full)) files.push(full);
  }

  return [...new Set(files)]
    .map((file) => relative(root, file).split(sep).join('/'))
    .sort();
}

function digestOf(root, relPaths) {
  const hash = createHash('sha256');
  for (const rel of relPaths) {
    hash.update(rel);
    hash.update('\0');
    hash.update(readFileSync(join(root, ...rel.split('/'))));
    hash.update('\0');
  }
  return hash.digest('hex');
}

/** Hash of the engine alone; its first 12 chars are the `?v=` cache token. */
export function engineDigest(root) {
  return digestOf(root, engineFiles(root));
}

/** Hash of everything that feeds one form's bake - the plugin's freshness key. */
export function freshnessSha(root, dataPath) {
  const relData = relative(root, dataPath).split(sep).join('/');
  const inputs = [relData, '_config.yml', '_data/uk.yml', ...engineFiles(root)];
  const hash = createHash('sha256');
  for (const rel of inputs) {
    hash.update(rel);
    hash.update('\0');
    const full = join(root, ...rel.split('/'));
    if (existsSync(full)) hash.update(readFileSync(full));
    hash.update('\0');
  }
  return hash.digest('hex');
}

/**
 * Builds the renderPage() options for a Jekyll-style site.
 *
 * @param {string} root repository root
 * @param {object} config parsed form config
 * @param {object} [overrides] adapter values that win over the YAML defaults
 */
export function loadSiteOpts(root, config, overrides = {}) {
  const site = optionalYaml(join(root, '_config.yml'));
  const uk = optionalYaml(join(root, '_data', 'uk.yml'));
  const assets = config.assets || {};

  const readAsset = (fromConfig, fallback) => {
    const rel = fromConfig || fallback;
    const full = join(root, ...rel.split('/'));
    return existsSync(full) ? readFileSync(full, 'utf8') : '';
  };

  return {
    base: site.baseurl || '',
    version: engineDigest(root).slice(0, 12),
    endpoint: (config.submit && config.submit.action) || site[`${config.id.replace(/-/g, '_')}_endpoint`] || '',
    rates: { usd: site.usd, eur: site.eur, nbu: site.nbu },
    turnstile: {
      enabled: site.turnstile_enabled === true,
      sitekey: site.turnstile_sitekey,
      language: site.turnstile_language,
      retryInterval: site.turnstile_retry_interval,
      maxRetries: site.turnstile_max_retries,
      localHosts: site.turnstile_local_hosts,
    },
    copy: {
      previous: uk.previous,
      next: uk.next,
      submit: uk.notify_submit,
      successTitle: uk.add_property_success,
      successText: uk.add_property_success_text,
      errorTitle: uk.add_property_error_title,
      errorCode: uk.add_property_error_code,
      retry: uk.add_property_retry,
      close: uk.close,
    },
    mapCss: readAsset(assets.leafletCss, '_includes/css/leaflet.css'),
    mapJs: readAsset(assets.leafletJs, '_includes/js/leaflet.js'),
    ...overrides,
  };
}
