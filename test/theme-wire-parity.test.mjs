import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseHTML } from 'linkedom';

import { loadYaml } from '../_form-engine/tools/yaml.mjs';
import { renderPage } from '../assets/js/form-engine/shell.js';
import { bootPage } from '../assets/js/form-engine/page-form.js';
import { FormRender } from '../assets/js/form-engine/render.js';

// The bootstrap4 wire suite mounts the baked add-property fragment. This file
// proves the same page works when the Tailwind theme renders it: the glue
// selector table, autocomplete, the G-1 map fallback, the location summary and
// the local captcha notice must behave identically. The page is rendered from
// the config (not the Bootstrap4-only bake) so both themes share one fixture.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = loadYaml(join(ROOT, '_data', 'add-property.yml'));

const THEMES = ['bootstrap4', 'tailwind'];

// Every selector page-form.js / binder.js uses on the add-property page. A
// theme that renames a class or drops a data hook fails here before a browser
// ever sees it. `.custom-file*` and `.alert-info` are neutral hooks in both
// themes even though their names look Bootstrap-ish.
const GLUE_SELECTORS = [
  '[data-field]',
  '[data-field-group]',
  '[data-location-field]',
  '[data-location-search]',
  '[data-location-dropdown]',
  '[data-location-clear]',
  '[data-location-summary]',
  '[data-location-summary-panel]',
  '[data-autocomplete-search]',
  '[data-autocomplete-dropdown]',
  '[data-autocomplete-clear]',
  '[data-captcha-field]',
  '[data-map-coords]',
  '[data-map-fallback]',
  '.custom-file',
  '.custom-file-label',
  '.file-previews',
  '.position-relative',
  '.location-search-icon',
  '.autocomplete-search-icon',
  '.captcha-widget',
  '.alert',
  '.alert-info',
  '.map-marker-info',
  '.invalid-feedback',
  '.valid-feedback',
  '[data-step-indicator]',
  '[data-step-nav]',
  '[data-step-title]',
  '[data-step-prev]',
  '[data-step-next]',
  '[data-submit]',
];

const flush = () => new Promise((r) => setTimeout(r, 0));
const fire = (window, el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));

const itemWith = (dropdown, text) =>
  Array.prototype.find.call(dropdown.querySelectorAll('.dropdown-item'),
    (it) => it.textContent.includes(text));

// linkedom's select.value does not reflect the selected <option>; the wire suite
// installs the same shim so location/select glue can read and write values.
function installSelectValue(document) {
  for (const sel of document.querySelectorAll('select')) {
    const proto = Object.getPrototypeOf(sel);
    if (!Object.getOwnPropertyDescriptor(proto, 'value').set) {
      Object.defineProperty(proto, 'value', {
        configurable: true,
        get() {
          const o = (this.options || []).find((x) => x.selected) || (this.options || [])[this.selectedIndex] || null;
          return o ? o.getAttribute('value') : '';
        },
        set(v) {
          for (const o of this.options || []) o.selected = o.getAttribute && o.getAttribute('value') === String(v);
        },
      });
    }
  }
}

// A fetch stub that never touches the network. all.json resolves to an empty
// address index (the summary check only needs controller data), everything else
// 404s. The captcha watcher gets a no-op interval so a booted page cannot keep
// the test process alive.
function mount(theme, { Captcha = null } = {}) {
  const config = { ...BASE, theme };
  const html = renderPage(config, { name: 'add-property', theme });
  const { window } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  const { document } = window;

  globalThis.window = window;
  globalThis.document = document;
  installSelectValue(document);

  const fetchImpl = async (url) => {
    if (String(url).includes('all.json')) return { ok: true, json: async () => [] };
    return { ok: false, status: 404, json: async () => ({}) };
  };

  const app = bootPage(document, {
    name: 'add-property',
    fetch: fetchImpl,
    leaflet: null,
    Captcha,
    setInterval: () => 0,
  });
  assert.ok(app, `${theme}: bootPage must mount add-property`);
  return { window, document, app, fetchImpl };
}

test('every glue selector finds its element in both themes', async () => {
  for (const theme of THEMES) {
    const { document } = mount(theme);
    await flush();
    await flush();

    for (const selector of GLUE_SELECTORS) {
      assert.ok(document.querySelector(selector), `${theme}: glue selector ${selector} found no element`);
    }
  }
});

test('the config island carries the booting theme and its nav tokens', async () => {
  for (const theme of THEMES) {
    const { document } = mount(theme);
    const island = JSON.parse(document.getElementById('add-property-config').textContent);

    assert.equal(island.theme, theme, `${theme}: the island must boot the rendered theme`);
    assert.deepEqual(island.chrome.nav, FormRender.theme(theme).navTokens,
      `${theme}: the island nav tokens must match the theme`);
  }
});

test('autocomplete, the G-1 map fallback and the location summary behave the same in both themes', async () => {
  for (const theme of THEMES) {
    const { window, document, app } = mount(theme);
    const { valid } = FormRender.theme(theme).validationClasses;
    await flush();
    await flush();

    // ---- autocomplete: type, open, pick, store, validate
    const search = document.querySelector('[data-autocomplete-search="type_address"]');
    const dropdown = document.querySelector('[data-autocomplete-dropdown="type_address"]');
    assert.ok(search && dropdown, `${theme}: type_address autocomplete controls are mounted`);

    search.focus();
    search.value = 'пр';
    fire(window, search, 'input');
    await flush();

    assert.equal(dropdown.style.display, 'block', `${theme}: typing opens the dropdown`);
    const target = itemWith(dropdown, 'провулок');
    assert.ok(target, `${theme}: the dropdown offers провулок`);
    assert.ok(target.classList.contains('dropdown-item'), `${theme}: the option keeps the dropdown-item hook`);

    target.dispatchEvent(new window.Event('mousedown', { bubbles: true, cancelable: true }));
    await flush();
    await flush();

    assert.equal(app.controller.getValue('type_address'), 'lane', `${theme}: the pick stores its value`);
    assert.equal(search.value, 'провулок', `${theme}: the pick fills the search input`);
    assert.ok(search.classList.contains(valid), `${theme}: the pick paints the theme's valid class`);

    // ---- G-1: address present hides the fallback, clearing it shows it again
    const fallback = document.querySelector('[data-map-fallback]');
    assert.ok(fallback, `${theme}: the map fallback hook is mounted`);
    assert.equal(fallback.hidden, false, `${theme}: no address yet leaves the fallback visible`);

    app.controller.setData('address', 'Київ');
    await flush();
    await flush();
    assert.equal(fallback.hidden, true, `${theme}: a known address hides the fallback`);

    app.controller.setData('address', '');
    await flush();
    await flush();
    assert.equal(fallback.hidden, false, `${theme}: clearing the address shows the fallback again`);

    // ---- location summary: hidden without a leaf, shown and filled with one
    const panel = document.querySelector('[data-location-summary-panel]');
    const box = document.querySelector('[data-location-summary]');
    assert.ok(panel && box, `${theme}: the summary panel and box are mounted`);
    assert.equal(panel.hidden, true, `${theme}: the summary stays hidden without a settlement`);

    app.controller.setData('location_widget', {
      oblast: '0342', oblastName: 'Івано-Франківська', oblastType: 'область',
      raion: '1338', raionName: 'Івано-Франківський', raionType: 'район',
      hromada: '3991', hromadaName: 'Івано-Франківська', hromadaType: 'громада',
      settlement: '30595', settlementName: 'Івано-Франківськ', settlementType: 'місто',
    });
    await app.refetchAddress();
    await flush();

    assert.equal(panel.hidden, false, `${theme}: a leaf value shows the summary`);
    assert.match(box.textContent, /Україна$/, `${theme}: the summary pins the country at the end`);

    app.controller.setData('location_widget', {});
    await app.refetchAddress();
    await flush();
    assert.equal(panel.hidden, true, `${theme}: clearing the leaf hides the summary again`);
  }
});

test('the local captcha notice is visible in both themes', async () => {
  const stub = {
    isLocal: () => true,
    enabled: () => false,
    solved: () => true,
    token: () => '',
    mount() {},
    reset() {},
  };

  for (const theme of THEMES) {
    const { document } = mount(theme, { Captcha: stub });
    await flush();
    await flush();

    const widget = document.querySelector('[data-captcha-field="captcha"]');
    assert.ok(widget, `${theme}: the captcha widget is mounted`);
    const card = widget.closest('.captcha-widget');
    assert.ok(card, `${theme}: the captcha card hook is mounted`);

    const notice = card.querySelector('.alert-info');
    assert.ok(notice, `${theme}: the local-mode notice is rendered`);
    assert.equal(notice.hidden, false, `${theme}: local mode reveals the notice`);
  }
});
