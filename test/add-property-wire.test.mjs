import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

import { bootPage as wireAddPropertyImpl } from '../assets/js/form-engine/page-form.js';
import { asInlineData } from '../assets/js/form-engine/data.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The captcha watcher arms a real setInterval (500ms, ~30s before it gives up).
// Stub the timer seam so a booted remote-captcha form cannot keep the test
// process alive after the assertions finish.
const wireAddProperty = (document, opts = {}) => wireAddPropertyImpl(document, { setInterval: () => 0, ...opts });

// The baked page fragment already carries the island, chrome, app and modals -
// exactly what the browser gets - so the test mounts the real thing instead of
// rebuilding a stand-in page.
const baked = readFileSync(join(ROOT, '_includes', 'form', 'app', 'add-property.html'), 'utf8')
  .replace(/^<!--\s*form-bake\b[^>]*-->\s*\n?/, '');

function mount() {
  const { window } = parseHTML(`<!doctype html><html><body>${baked}</body></html>`);
  const { document } = window;
  globalThis.document = document;
  globalThis.window = window;

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
          const opts = this.options || [];
          for (const o of opts) o.selected = o.getAttribute && o.getAttribute('value') === String(v);
        },
      });
    }
  }

  return { window, document };
}

const tick = (ms) => new Promise((r) => setTimeout(r, ms));
const flush = () => new Promise((r) => setTimeout(r, 0));
const fire = (window, el, type) => {
  const ev = new window.Event(type, { bubbles: true });
  el.dispatchEvent(ev);
};

function findSettlement(all, id) {
  for (const oblast of all) {
    for (const raion of (oblast.raions || [])) {
      for (const hromada of (raion.hromadas || [])) {
        for (const s of (hromada.settlements || [])) {
          if (String(s.id) === String(id)) return { s, raion, hromada, oblast };
        }
      }
    }
  }
  return null;
}

// A compact stand-in for /assets/data/all.json: the leaf has more than the
// field's threshold (6) of options, so it opens in search mode, and clearing
// it stays cheap (the real file renders tens of thousands of <option>s).
const ADDR = [
  { id: '0342', name: 'Івано-Франківська', type: 'область', raions: [
    { id: '1338', name: 'Івано-Франківський', type: 'район', hromadas: [
      { id: '3991', name: 'Івано-Франківська', type: 'громада', settlements: [
        { id: '30595', name: 'Івано-Франківськ', type: 'місто' },
        { id: '9001', name: 'Івано-Франківськ село', type: 'село' },
        { id: '9002', name: 'Вовчинець', type: 'село' },
        { id: '9003', name: 'Крихівці', type: 'село' },
        { id: '9006', name: 'Угорники', type: 'село' },
        { id: '9007', name: 'Микитинці', type: 'село' },
        { id: '9008', name: 'Хриплин', type: 'село' },
      ] },
      { id: '3992', name: 'Богородчанська', type: 'громада', settlements: [
        { id: '9009', name: 'Богородчани', type: 'смт' },
      ] },
    ] },
  ] },
];

const addrFetch = async (url) => {
  if (String(url).includes('all.json')) return { ok: true, json: async () => ADDR };
  return { ok: false, status: 404, json: async () => ({}) };
};

const findLocationWidget = (node) => {
  if (Array.isArray(node)) {
    for (const v of node) {
      const w = findLocationWidget(v);
      if (w) return w;
    }
    return null;
  }
  if (node && typeof node === 'object') {
    if (node.widget === 'location') return node;
    for (const v of Object.values(node)) {
      const w = findLocationWidget(v);
      if (w) return w;
    }
  }
  return null;
};

// Production ships settings.method: one (Change #5236); the legacy method:
// two mode (Change #5239) is exercised by flipping the mounted island.
const mountMethodTwo = () => {
  const mounted = mount();
  const island = mounted.document.getElementById('add-property-config');
  const cfg = JSON.parse(island.textContent);
  const widget = findLocationWidget(cfg);
  if (!widget || !widget.settings) throw new Error('the mounted config must carry the location widget');
  widget.settings.method = 'two';
  island.textContent = JSON.stringify(cfg);
  return mounted;
};

// Pin the root ancestor (oblast) to a single-value preset the way the real
// config does (value.default.value / readonly), so a leaf clear must keep it.
const mountMethodTwoPresetOblast = (readonly) => {
  const mounted = mountMethodTwo();
  const island = mounted.document.getElementById('add-property-config');
  const cfg = JSON.parse(island.textContent);
  const widget = findLocationWidget(cfg);
  const oblast = widget.fields.find((f) => f.name === 'oblast');
  oblast.value = { default: { value: ['0342'], readonly } };
  island.textContent = JSON.stringify(cfg);
  return mounted;
};

const bootLocation = async (document, impl = addrFetch) => {
  globalThis.fetch = impl;
  const app = wireAddProperty(document, { fetch: impl, leaflet: null, Captcha: null });
  await flush(); await flush(); await flush(); await tick(30); await flush();
  return app;
};

const feedbackOf = (el) => el.closest('[data-field-group]').querySelector('.invalid-feedback');

const itemWith = (dropdown, text) =>
  Array.prototype.find.call(dropdown.querySelectorAll('.dropdown-item'), (it) => it.textContent.includes(text));

// MOD-13: derive names from the mounted config instead of baking a field name
// into the test. A rename must not require touching this suite.
const readConfig = (document) => JSON.parse(document.getElementById('add-property-config').textContent);

const walkConfig = (node, visit) => {
  if (Array.isArray(node)) {
    for (const value of node) walkConfig(value, visit);
    return;
  }
  if (node && typeof node === 'object') {
    visit(node);
    for (const value of Object.values(node)) walkConfig(value, visit);
  }
};

const fieldsOf = (config, predicate = () => true) => {
  const found = [];
  walkConfig(config, (node) => {
    if (typeof node.name === 'string' && typeof node.type === 'string' && predicate(node)) found.push(node);
  });
  return found;
};

const mountAutocomplete = (document) => {
  const fields = fieldsOf(readConfig(document), (f) => f.type === 'autocomplete');
  assert.equal(fields.length, 1, 'the mounted config must carry exactly one autocomplete field');
  const field = fields[0];
  const options = asInlineData(field.data);
  assert.ok(options && options.length, 'the autocomplete must carry inline options');
  const name = field.name;
  return {
    field,
    options,
    name,
    search: document.querySelector(`[data-autocomplete-search="${name}"]`),
    dropdown: document.querySelector(`[data-autocomplete-dropdown="${name}"]`),
    clear: document.querySelector(`[data-autocomplete-clear="${name}"]`),
    select: document.querySelector(`select[data-field="${name}"]`),
  };
};

// Pick an option whose short prefix is unambiguous, so the typed query always
// filters down to exactly that option regardless of its label.
const uniqueOption = (options, minChars = 2) => {
  for (const opt of options) {
    const label = String(opt.name);
    if (label.length < minChars) continue;
    const query = label.slice(0, minChars);
    if (options.filter((o) => String(o.name).startsWith(query)).length === 1) return { opt, query };
  }
  const opt = options[0];
  return { opt, query: String(opt.name) };
};

const setLocationFromConfig = (document, ctl, settlementId = '30595') => {
  const widget = findLocationWidget(readConfig(document));
  assert.ok(widget && Array.isArray(widget.fields), 'the mounted config must carry the location widget');
  const chain = findSettlement(ADDR, settlementId);
  assert.ok(chain, `settlement ${settlementId} must exist in the address fixture`);
  const part = (name) => {
    const field = widget.fields.find((f) => f.name === name);
    assert.ok(field, `the location widget must carry the ${name} sub-field`);
    return field.name;
  };
  const oblast = part('oblast');
  const raion = part('raion');
  const hromada = part('hromada');
  const settlement = part('settlement');
  ctl.setData(widget.name, {
    [oblast]: chain.oblast.id,
    [`${oblast}Type`]: chain.oblast.type,
    [`${oblast}Name`]: chain.oblast.name,
    [raion]: chain.raion.id,
    [`${raion}Name`]: chain.raion.name,
    [hromada]: chain.hromada.id,
    [`${hromada}Name`]: chain.hromada.name,
    [settlement]: chain.s.id,
    [`${settlement}Type`]: chain.s.type,
    [`${settlement}Name`]: chain.s.name,
  });
  return widget;
};

const assertAutocompleteHooksMatchConfig = (document) => {
  const mounted = Array.from(document.querySelectorAll('[data-autocomplete-search]'), (el) =>
    el.getAttribute('data-autocomplete-search'));
  const configured = fieldsOf(readConfig(document), (f) => f.type === 'autocomplete').map((f) => f.name);
  assert.deepEqual(mounted.sort(), configured.sort(), 'every configured autocomplete is mounted exactly once');
};

const locationRootOf = (document) => {
  const widget = findLocationWidget(readConfig(document));
  assert.ok(widget, 'the mounted config must carry the location widget');
  return widget.name;
};
const locValue = (ctl, document, part) => ctl.getValue(`${locationRootOf(document)}.${part}`);
const locId = (document, part) => `field_${locationRootOf(document)}_${part}`;

// MOD-13: generic autocomplete contract — typing filters inline options, a pick
// stores the option id, blur keeps it. No field name is hardcoded.
test('autocomplete with inline data filters options, stores the pick and survives blur', async () => {
  const { window, document } = mount();

  const app = wireAddProperty(document, { fetch: addrFetch, leaflet: null, Captcha: null });
  assert.ok(app, 'wireAddProperty must boot');
  const ctl = app.controller;

  await flush(); await flush(); await flush();

  assertAutocompleteHooksMatchConfig(document);
  const ac = mountAutocomplete(document);
  const { search, dropdown, select, name } = ac;
  assert.ok(search && dropdown && select, `${name} autocomplete controls must be mounted`);
  const { opt, query } = uniqueOption(ac.options);

  for (const ch of query) {
    search.focus();
    search.value += ch;
    fire(window, search, 'input');
    await flush(); await flush();
  }

  const items = dropdown.querySelectorAll('.dropdown-item');
  assert.ok(Array.prototype.some.call(items, (it) => it.textContent.trim() === String(opt.name)),
    `dropdown must contain the inline "${opt.name}" option`);
  assert.equal(dropdown.style.display, 'block', 'dropdown must be visible while typing');
  assert.equal(select.hidden, true, 'select stays hidden in search mode');
  assert.equal(search.closest('.position-relative').hidden, false, 'search input is used in search mode');

  const target = Array.prototype.find.call(items, (it) => it.textContent.trim() === String(opt.name));
  target.dispatchEvent(new window.Event('mousedown', { bubbles: true, cancelable: true }));
  await flush(); await flush();

  assert.equal(ctl.getValue(name), String(opt.id), 'choosing an option stores its inline id');
  assert.equal(search.value, String(opt.name), 'search input must show the chosen name');

  search.dispatchEvent(new window.Event('blur', { bubbles: true }));
  await flush(); await flush(); await tick(20);
  assert.equal(ctl.getValue(name), String(opt.id), 'the chosen id survives blur');
  assert.equal(search.value, String(opt.name), 'the chosen name survives blur');
});

test('an unpicked autocomplete keeps its text and turns invalid on blur', async () => {
  const { window, document } = mount();
  const app = await bootLocation(document);
  assert.ok(app, 'wireAddProperty must boot');

  const ac = mountAutocomplete(document);
  const { search, name } = ac;
  assert.ok(search, `${name} autocomplete must be mounted`);

  search.focus();
  search.value = 'пррр';
  fire(window, search, 'input');
  await flush();

  assert.equal(app.controller.getValue(name), '', 'typing alone stores no value');
  assert.equal(search.value, 'пррр', 'the typed query stays in the control');
  assert.equal(search.classList.contains('is-invalid'), true, 'a query with no matches is red while typing');
  assert.equal(search.classList.contains('is-valid'), false, 'an uncommitted query is never valid');

  fire(window, search, 'blur');
  await tick(20); await flush();

  assert.equal(search.value, 'пррр', 'blur keeps the uncommitted text');
  assert.equal(search.classList.contains('is-invalid'), true, 'blur keeps the invalid state');
  assert.equal(search.classList.contains('is-valid'), false, 'blur does not turn uncommitted text valid');
  assert.equal(feedbackOf(search).style.display, 'block', 'the required message shows after blur');
});

test('one click on the autocomplete clear button empties the field', async () => {
  const { window, document } = mount();
  const app = await bootLocation(document);
  assert.ok(app, 'wireAddProperty must boot');

  const ac = mountAutocomplete(document);
  const { search, dropdown, clear, name } = ac;
  assert.ok(search && dropdown && clear, `${name} controls must be mounted`);
  const { opt, query } = uniqueOption(ac.options);

  search.focus();
  search.value = query;
  fire(window, search, 'input');
  await flush();

  const target = itemWith(dropdown, String(opt.name));
  assert.ok(target, `the dropdown must offer ${opt.name}`);
  target.dispatchEvent(new window.Event('mousedown', { bubbles: true, cancelable: true }));
  await flush(); await flush();

  assert.equal(app.controller.getValue(name), String(opt.id), 'the pick is stored');
  assert.equal(search.value, String(opt.name), 'the pick fills the search input');
  assert.equal(search.classList.contains('is-valid'), true, 'the pick shows valid');
  assert.equal(clear.hidden, false, 'the clear button shows once a value is picked');

  fire(window, search, 'blur');
  await tick(20); await flush();
  assert.equal(search.classList.contains('is-valid'), true, 'the green state survives blur');
  assert.equal(search.value, String(opt.name), 'the picked name survives blur');

  fire(window, clear, 'click');
  await flush();

  assert.equal(app.controller.getValue(name), '', 'one click clears the stored value');
  assert.equal(search.value, '', 'one click clears the search input');
  assert.equal(clear.hidden, true, 'the clear button hides again');
  assert.equal(search.classList.contains('is-invalid'), true, 'a cleared required field is red');
  assert.equal(search.classList.contains('is-valid'), false, 'a cleared field is not valid');
  const icon = search.parentElement.querySelector('.autocomplete-search-icon');
  assert.equal(icon.hidden, false, 'the magnifier comes back');
  assert.equal(feedbackOf(search).style.display, 'block', 'the required message shows');
});

// MOD-13: keep the original invariant without naming either field — clearing
// an autocomplete must not neutralize another field's invalid state.
test('clearing an autocomplete leaves an unrelated required field invalid', async () => {
  const { window, document } = mount();
  const app = await bootLocation(document);
  assert.ok(app, 'wireAddProperty must boot');
  const ctl = app.controller;

  const ac = mountAutocomplete(document);
  const otherField = fieldsOf(readConfig(document), (f) =>
    f.required && f.type === 'text' && f.name !== ac.name)
    .find((f) => document.getElementById(`field_${f.name}`));
  assert.ok(otherField, 'the config must carry another required text field');
  const other = document.getElementById(`field_${otherField.name}`);
  ctl.setServerErrors({ [otherField.name]: 'Серверна помилка' });
  await flush();
  assert.equal(other.classList.contains('is-invalid'), true, 'the unrelated field starts invalid');

  assert.ok(ac.search && ac.clear, `${ac.name} controls must be mounted`);
  ac.search.focus();
  ac.search.value = uniqueOption(ac.options).query;
  fire(window, ac.search, 'input');
  await flush();
  assert.equal(ac.clear.hidden, false, `typing in ${ac.name} shows its clear button`);

  fire(window, ac.clear, 'click');
  await flush();

  assert.equal(ac.search.value, '', `clearing ${ac.name} empties its search input`);
  assert.equal(ctl.getValue(ac.name), '', `clearing ${ac.name} stores no value`);
  assert.equal(other.classList.contains('is-invalid'), true,
    `clearing ${ac.name} must not neutralize another field`);
  assert.equal(ac.search.classList.contains('is-invalid'), true, `the cleared required ${ac.name} is red`);
});

test('validateStep paints an uncommitted autocomplete red without a blur', async () => {
  const { window, document } = mount();
  const app = await bootLocation(document);
  assert.ok(app, 'wireAddProperty must boot');

  const ac = mountAutocomplete(document);
  const { search, name } = ac;
  assert.ok(search, `${name} autocomplete must be mounted`);

  search.focus();
  search.value = uniqueOption(ac.options).query;
  fire(window, search, 'input');
  await flush();

  assert.equal(search.classList.contains('is-invalid'), false,
    'matching but unpicked text stays neutral while typing');

  let stepIndex = -1;
  readConfig(document).steps.forEach((step, index) => {
    if (stepIndex >= 0) return;
    walkConfig(step, (node) => { if (node.name === name) stepIndex = index; });
  });
  assert.ok(stepIndex >= 0, `${name} must live in a configured step`);

  app.controller.validateStep(stepIndex);
  await flush();

  assert.equal(search.classList.contains('is-invalid'), true,
    'validateStep must paint the uncommitted required field red');
  assert.equal(feedbackOf(search).style.display, 'block', 'the required feedback block is shown');
});

test('server errors still paint autocomplete search inputs after the binder hand-off', async () => {
  const { window, document } = mount();
  const app = await bootLocation(document);
  assert.ok(app, 'wireAddProperty must boot');

  const ac = mountAutocomplete(document);
  const { search, name } = ac;
  assert.ok(search, `${name} autocomplete must be mounted`);

  app.controller.setServerErrors({ [name]: 'Серверна помилка' });
  await flush();

  assert.equal(search.classList.contains('is-invalid'), true, 'a server error turns the search input red');
  assert.equal(search.title, 'Серверна помилка', 'the server message reaches the title');

  app.controller.setServerErrors({});
  await flush();

  assert.equal(search.classList.contains('is-invalid'), false, 'clearing the server report restores the neutral state');
});

// MOD-13: generic invariant — a location change must not re-resolve an
// autocomplete source. No field name is hardcoded.
test('autocomplete source stays config-local after the location widget changes', async () => {
  const { window, document } = mount();

  const app = wireAddProperty(document, { fetch: addrFetch, leaflet: null, Captcha: null });
  assert.ok(app, 'wireAddProperty must boot');
  const ctl = app.controller;

  await flush(); await flush(); await flush();

  const cfg = readConfig(document);
  const widget = findLocationWidget(cfg);
  assert.ok(widget, 'the mounted config must carry the location widget');
  const dependent = fieldsOf(cfg, (f) => f.type === 'autocomplete' &&
    (f.datas || []).some((d) => String((d && d.field) || '').startsWith(`${widget.name}.`)));
  assert.equal(dependent.length, 0, 'no autocomplete may resolve its source from the location widget');
  assertAutocompleteHooksMatchConfig(document);

  setLocationFromConfig(document, ctl, '9001');
  await flush(); await flush(); await tick(30); await flush();

  const ac = mountAutocomplete(document);
  const { search, dropdown, name } = ac;
  assert.ok(search && dropdown, `${name} autocomplete controls must be mounted`);
  const opt = ac.options[ac.options.length - 1];

  for (const ch of String(opt.name)) {
    search.focus();
    search.value += ch;
    fire(window, search, 'input');
    await flush(); await flush();
  }

  const items = dropdown.querySelectorAll('.dropdown-item');
  const target = Array.prototype.find.call(items, (it) => it.textContent.trim() === String(opt.name));
  assert.ok(target, `the inline "${opt.name}" option must still be served after a location change`);

  target.dispatchEvent(new window.Event('mousedown', { bubbles: true, cancelable: true }));
  await flush(); await flush();
  assert.equal(ctl.getValue(name), String(opt.id), 'the config-local id is stored');
});

test('location widget toggles between select and search per field according to the old engine semantics', async () => {
  const { window, document } = mount();

  globalThis.fetch = async (url) => {
    const abs = join(ROOT, String(url).replace(/^\//, ''));
    try {
      const txt = readFileSync(abs, 'utf8');
      return { ok: true, json: async () => JSON.parse(txt) };
    } catch {
      return { ok: false, status: 404, json: async () => ({}) };
    }
  };

  const app = wireAddProperty(document, { fetch: globalThis.fetch, leaflet: null, Captcha: null });
  assert.ok(app, 'wireAddProperty must boot');
  const ctl = app.controller;

  await flush(); await flush(); await flush();

  const vis = (fieldName) => {
    const sel = document.querySelector(`select[data-location-field="${fieldName}"]`);
    const search = document.querySelector(`input[data-location-search="${fieldName}"]`);
    const wrap = search ? search.closest('.position-relative') : null;
    return {
      select: sel ? { hidden: sel.hidden, value: sel.value, disabled: sel.disabled } : null,
      search: search ? { hidden: wrap ? wrap.hidden : null, readOnly: search.readOnly } : null,
    };
  };

  const oblast = vis('oblast');
  assert.equal(oblast.select.hidden, false, 'oblast is select-mode with a preset, its select must be visible');
  assert.equal(oblast.select.value, '0342', 'oblast preset must be applied');
  assert.equal(oblast.search.hidden, true, 'oblast search must be hidden in select mode');

  assert.equal(vis('raion').select.hidden, false, 'raion is select-mode (few children), select must be visible');

  ctl.setData(locationRootOf(document), {
    oblast: '0342', oblastType: 'область', oblastName: 'Івано-Франківська область',
    raion: '1338', hromada: '3991', settlement: '30595', settlementType: 'місто', settlementName: 'Івано-Франківськ',
  });
  await flush(); await flush(); await tick(30); await flush();

  assert.equal(locValue(ctl, document, 'settlement'), '30595', 'the programmatic location value is stored');

  assert.equal(vis('raion').select.hidden, false, 'raion stays select-mode once its parent is set');
  assert.equal(vis('hromada').select.hidden, true, 'hromada flips to search-mode once its parent chain is set');
  assert.equal(vis('hromada').search.hidden, false, 'hromada search must be visible in search mode');
  assert.equal(vis('settlement').select.hidden, true, 'settlement flips to search-mode once its parent chain is set');
  assert.equal(vis('settlement').search.hidden, false, 'settlement search must be visible');

  const search = document.querySelector('input[data-location-search="settlement"]');
  search.value = 'Івано-Франківськ';
  fire(window, search, 'input');
  await flush(); await flush();

  const drop = document.querySelector('[data-location-dropdown="settlement"]');
  const items = drop.querySelectorAll('.dropdown-item');
  assert.ok(items.length >= 1, `expected settlement option in the dropdown, got ${items.length}`);
  assert.ok(Array.prototype.some.call(items, (it) => it.textContent.trim().includes('Івано-Франківськ')),
    'milestone: settlement search must offer Івано-Франківськ');

  assert.equal(locValue(ctl, document, 'settlement'), '', 'typing a partial query drops the uncommitted value');
});

test('captcha is skipped without a CaptchaSite or in local mode, and gates the form when remote', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });

  const boot = (Captcha) => {
    const { document } = mount();
    const app = wireAddProperty(document, { fetch: globalThis.fetch, leaflet: null, Captcha });
    return { document, ctl: app.controller };
  };
  const stub = (over) => ({ isLocal: () => false, enabled: () => true, solved: () => false, token: () => '', mount() {}, reset() {}, ...over });

  const absent = boot(null);
  await flush(); await flush(); await flush();
  assert.ok(!absent.ctl.rawFieldError('captcha'), 'a build without CaptchaSite (Turnstile disabled) must not block the form');

  const local = boot(stub({ isLocal: () => true, enabled: () => false, solved: () => true }));
  await flush(); await flush(); await flush();
  assert.ok(!local.ctl.rawFieldError('captcha'), 'local mode counts as solved, so it must not block the form');
  const localCard = local.document.querySelector('[data-captcha-field="captcha"]').closest('.captcha-widget');
  assert.equal(localCard.querySelector('.alert-info').hidden, false, 'local mode must reveal the local notice');

  const remote = boot(stub());
  await flush(); await flush(); await flush();
  assert.ok(remote.ctl.rawFieldError('captcha'), 'a remote, unsolved captcha stays required');
  const remoteCard = remote.document.querySelector('[data-captcha-field="captcha"]').closest('.captcha-widget');
  assert.equal(remoteCard.querySelector('.alert-info').hidden, true, 'remote mode must hide the local notice');

  remote.ctl.setCaptchaToken('captcha', 'TOK');
  assert.ok(!remote.ctl.rawFieldError('captcha'), 'a token reported by the watch satisfies the required captcha');
});

test('method "two" fills the ancestors when the leaf settlement is picked, and clearing it wipes them', async () => {
  const { window, document } = mountMethodTwo();
  globalThis.fetch = addrFetch;

  const app = wireAddProperty(document, { fetch: globalThis.fetch, leaflet: null, Captcha: null });
  const ctl = app.controller;
  await flush(); await flush(); await flush(); await tick(30); await flush();

  const search = document.querySelector('input[data-location-search="settlement"]');
  assert.ok(search, 'the settlement search control must be mounted');

  search.value = 'Івано-Франківськ';
  fire(window, search, 'input');
  await flush();

  const dropdown = document.querySelector('[data-location-dropdown="settlement"]');
  const items = dropdown.querySelectorAll('.dropdown-item');
  const target = Array.prototype.find.call(items, (it) => it.textContent.includes('Івано-Франківськ'));
  assert.ok(target, 'the settlement dropdown must offer an Івано-Франківськ option');
  assert.ok(target.classList.contains('searchable-dropdown-item'),
    'parent-info items must carry the wrapping class (white-space: normal) so the ancestor tail does not force a horizontal scrollbar');
  target.dispatchEvent(new window.Event('mousedown', { bubbles: true, cancelable: true }));
  await flush(); await flush();

  assert.equal(locValue(ctl, document, 'settlement'), '30595', 'the chosen leaf value must be stored');
  assert.equal(locValue(ctl, document, 'raion'), '1338', 'method two must fill the raion ancestor');
  assert.equal(locValue(ctl, document, 'hromada'), '3991', 'method two must fill the hromada ancestor');
  assert.equal(locValue(ctl, document, 'oblast'), '0342', 'method two must fill the oblast ancestor');

  const raionSelect = document.querySelector('select[data-location-field="raion"]');
  assert.equal(raionSelect.closest('.form-group').hidden, false, 'a filled middle field must become visible');
  assert.equal(raionSelect.disabled, true, 'a filled middle field is locked in method two');

  fire(window, document.querySelector('[data-location-clear="settlement"]'), 'click');
  await flush(); await flush();
  assert.equal(locValue(ctl, document, 'settlement'), '', 'clearing the leaf wipes the leaf');
  assert.equal(locValue(ctl, document, 'raion'), '', 'clearing the leaf wipes the raion ancestor');
  assert.equal(locValue(ctl, document, 'hromada'), '', 'clearing the leaf wipes the hromada ancestor');
});

for (const readonly of [true, false]) {
  test(`method "two" keeps a preset (readonly: ${readonly}) ancestor when the leaf is cleared`, async () => {
    const { window, document } = mountMethodTwoPresetOblast(readonly);
    globalThis.fetch = addrFetch;

    const app = wireAddProperty(document, { fetch: globalThis.fetch, leaflet: null, Captcha: null });
    const ctl = app.controller;
    await flush(); await flush(); await flush(); await tick(30); await flush();

    const search = document.querySelector('input[data-location-search="settlement"]');
    search.value = 'Івано-Франківськ';
    fire(window, search, 'input');
    await flush();

    const dropdown = document.querySelector('[data-location-dropdown="settlement"]');
    const target = Array.prototype.find.call(
      dropdown.querySelectorAll('.dropdown-item'),
      (it) => it.textContent.includes('Івано-Франківськ'),
    );
    assert.ok(target, 'the settlement dropdown must offer an Івано-Франківськ option');
    target.dispatchEvent(new window.Event('mousedown', { bubbles: true, cancelable: true }));
    await flush(); await flush();

    assert.equal(locValue(ctl, document, 'oblast'), '0342', 'the preset oblast must be auto-filled');
    assert.equal(locValue(ctl, document, 'hromada'), '3991', 'method two must fill the hromada ancestor');

    fire(window, document.querySelector('[data-location-clear="settlement"]'), 'click');
    await flush(); await flush();

    assert.equal(locValue(ctl, document, 'settlement'), '', 'clearing the leaf still wipes the leaf');
    assert.equal(locValue(ctl, document, 'hromada'), '', 'a non-preset ancestor is still wiped');
    assert.equal(locValue(ctl, document, 'raion'), '', 'a non-preset ancestor is still wiped');
    assert.equal(locValue(ctl, document, 'oblast'), '0342',
      'a preset ancestor must survive the leaf clear (readonly or not)');
    assert.equal(locValue(ctl, document, 'oblastName'), 'Івано-Франківська',
      'the preset ancestor label must survive too');
  });
}
test('location chrome follows typing: «-» is invalid, «ів» searches while uncommitted', async () => {
  const { window, document } = mountMethodTwo();
  const app = await bootLocation(document);
  assert.ok(app, 'wireAddProperty must boot');

  const search = document.querySelector('input[data-location-search="settlement"]');
  const clearBtn = document.querySelector('[data-location-clear="settlement"]');
  const icon = search.parentElement.querySelector('.location-search-icon');
  const dropdown = document.querySelector('[data-location-dropdown="settlement"]');
  const label = document.querySelector(`label[for^="${locId(document, 'settlement')}"]`);
  assert.ok(search && clearBtn && icon && dropdown && label, 'the settlement chrome must be mounted');

  assert.equal(clearBtn.hidden, true, 'no clear button before anything is typed');
  assert.equal(icon.hidden, false, 'the magnifier shows while the field is empty');
  assert.equal(label.getAttribute('for'), `${locId(document, 'settlement')}_search`,
    'the label must point at the search input while the field is in search mode');

  search.value = '-';
  fire(window, search, 'input');
  await flush();
  assert.equal(search.classList.contains('is-invalid'), true,
    '«-» matches the pattern but sits below minChars, so it is not a pick and the field is invalid');
  assert.equal(feedbackOf(search).textContent, 'Будь ласка, заповніть це поле',
    'a short uncommitted query reports the required message');
  assert.equal(feedbackOf(search).style.display, 'block', 'the uncommitted feedback shows');
  assert.equal(search.classList.contains('is-valid'), false, 'an uncommitted query is never valid');
  assert.equal(dropdown.style.display, 'none', 'a one-character query keeps the dropdown closed');
  assert.equal(clearBtn.hidden, false, 'any typed text shows the clear button (legacy x-show)');
  assert.equal(icon.hidden, true, 'typed text hides the magnifier');

  search.value = 'ів';
  fire(window, search, 'input');
  await flush();
  assert.equal(search.classList.contains('is-invalid'), false, '«ів» reaches minChars with matches and stays neutral');
  assert.equal(search.classList.contains('is-valid'), false, 'a partial query is not a committed pick');
  assert.equal(feedbackOf(search).style.display, 'none', 'a live query shows no feedback');
  assert.equal(dropdown.style.display, 'block', '«ів» reaches minChars and must open the dropdown');
  assert.ok(dropdown.querySelectorAll('.dropdown-item').length >= 1, '«ів» must offer settlement matches');
  assert.equal(clearBtn.hidden, false, 'the clear button stays while text is typed');
});

test('a query above minChars with no matches reports the no-results message', async () => {
  const { window, document } = mountMethodTwo();
  const app = await bootLocation(document);
  assert.ok(app, 'wireAddProperty must boot');

  const search = document.querySelector('input[data-location-search="settlement"]');
  search.value = 'ььь';
  fire(window, search, 'input');
  await flush();
  assert.equal(search.classList.contains('is-invalid'), true, 'a query with no matches is invalid');
  assert.equal(feedbackOf(search).textContent, 'Запис "ььь" відсутній у списку',
    'the no-results message names the query');
});

test('editing the picked label drops the stored value and the field stops being valid', async () => {
  const { window, document } = mountMethodTwo();
  const app = await bootLocation(document);
  const ctl = app.controller;
  assert.ok(app, 'wireAddProperty must boot');

  const search = document.querySelector('input[data-location-search="settlement"]');
  search.value = 'Івано-Франківськ';
  fire(window, search, 'input');
  await flush();
  const dropdown = document.querySelector('[data-location-dropdown="settlement"]');
  const target = itemWith(dropdown, 'Івано-Франківськ');
  assert.ok(target, 'the settlement dropdown must offer Івано-Франківськ');
  target.dispatchEvent(new window.Event('mousedown', { bubbles: true, cancelable: true }));
  await flush(); await flush();
  assert.equal(locValue(ctl, document, 'settlement'), '30595', 'the pick is stored');
  assert.equal(search.classList.contains('is-valid'), true, 'a committed pick is valid');

  search.value = '-';
  fire(window, search, 'input');
  await flush();
  assert.equal(locValue(ctl, document, 'settlement'), '', 'overwriting the label drops the stored id');
  assert.equal(search.classList.contains('is-valid'), false, 'the field must not stay valid');
  assert.equal(search.classList.contains('is-invalid'), true, 'the mismatching text is invalid');
  assert.equal(feedbackOf(search).textContent, 'Будь ласка, заповніть це поле', 'the required message returns');
});

test('blur keeps the typed query and its pattern state (legacy only validated)', async () => {
  const { window, document } = mountMethodTwo();
  const app = await bootLocation(document);
  const ctl = app.controller;
  assert.ok(app, 'wireAddProperty must boot');

  const search = document.querySelector('input[data-location-search="settlement"]');
  const clearBtn = document.querySelector('[data-location-clear="settlement"]');
  const dropdown = document.querySelector('[data-location-dropdown="settlement"]');
  assert.ok(search && clearBtn && dropdown, 'the settlement chrome must be mounted');

  search.value = 'Івано-Франківськ';
  fire(window, search, 'input');
  await flush();
  const target = itemWith(dropdown, 'Івано-Франківськ');
  assert.ok(target, 'the settlement dropdown must offer Івано-Франківськ');
  target.dispatchEvent(new window.Event('mousedown', { bubbles: true, cancelable: true }));
  await flush(); await flush();
  assert.equal(locValue(ctl, document, 'settlement'), '30595', 'the leaf must be stored');

  search.value = '12';
  fire(window, search, 'input');
  await flush();
  assert.equal(locValue(ctl, document, 'settlement'), '', 'overwriting the label drops the stored id');
  assert.equal(search.classList.contains('is-invalid'), true, 'digits fail the Ukrainian-only pattern');
  assert.equal(feedbackOf(search).textContent, 'Тільки українські літери', 'the field-level pattern message wins');
  assert.equal(feedbackOf(search).style.display, 'block', 'the pattern feedback shows while typing');

  fire(window, search, 'blur');
  await tick(20); await flush();

  assert.equal(search.value, '12', 'blur must not wipe the typed query');
  assert.equal(search.classList.contains('is-invalid'), true, 'the pattern error survives the blur');
  assert.equal(feedbackOf(search).textContent, 'Тільки українські літери', 'the pattern message survives the blur');
  assert.equal(feedbackOf(search).style.display, 'block', 'the feedback block stays open');
  assert.equal(clearBtn.hidden, false, 'the clear button stays while text is typed');
  assert.equal(dropdown.style.display, 'none', 'the dropdown is closed');
});

test('picking a parent wipes the child’s query, pattern error and dropdown', async () => {
  const { window, document } = mountMethodTwo();
  const all = JSON.parse(readFileSync(join(ROOT, 'assets/data/all.json'), 'utf8'));
  const chain = findSettlement(all, '30595');
  assert.ok(chain, 'settlement 30595 must exist in all.json');
  const realFetch = async (url) => {
    if (String(url).includes('all.json')) return { ok: true, json: async () => all };
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const app = await bootLocation(document, realFetch);
  const ctl = app.controller;
  assert.ok(app, 'wireAddProperty must boot');

  const search = document.querySelector('input[data-location-search="settlement"]');
  const clearBtn = document.querySelector('[data-location-clear="settlement"]');
  const dropdown = document.querySelector('[data-location-dropdown="settlement"]');
  assert.ok(search && clearBtn && dropdown, 'the settlement chrome must be mounted');

  search.value = '12';
  fire(window, search, 'input');
  await flush();
  assert.equal(search.classList.contains('is-invalid'), true, 'digits make the child red');
  assert.equal(feedbackOf(search).style.display, 'block', 'the child shows the pattern feedback');

  const hsearch = document.querySelector('input[data-location-search="hromada"]');
  assert.ok(hsearch, 'the hromada search control must be mounted');
  hsearch.value = chain.hromada.name;
  fire(window, hsearch, 'input');
  await flush();
  const hdropdown = document.querySelector('[data-location-dropdown="hromada"]');
  const hitems = hdropdown.querySelectorAll('.dropdown-item');
  assert.ok(hitems.length >= 1, `the hromada dropdown must offer ${chain.hromada.name}`);
  hitems[0].dispatchEvent(new window.Event('mousedown', { bubbles: true, cancelable: true }));
  await flush(); await flush();

  assert.ok(String(locValue(ctl, document, 'hromada')), 'the parent pick must be stored');
  assert.equal(search.value, '', 'the cascade drops the child’s typed query');
  assert.equal(search.classList.contains('is-invalid'), false, 'the cascade clears the child’s pattern error');
  assert.equal(feedbackOf(search).style.display, 'none', 'the child’s feedback closes');
  assert.equal(clearBtn.hidden, true, 'the child’s clear button hides with the empty query');
  assert.equal(dropdown.style.display, 'none', 'the child’s dropdown is closed');
});

test('a blurred empty location sub-field reports the required message in the legacy order', async () => {
  const { window, document } = mountMethodTwo();
  const app = await bootLocation(document);
  assert.ok(app, 'wireAddProperty must boot');

  const search = document.querySelector('input[data-location-search="settlement"]');
  fire(window, search, 'blur');
  await tick(20); await flush();
  assert.equal(search.classList.contains('is-invalid'), true, 'an empty required sub-field errors on blur');
  assert.equal(feedbackOf(search).style.display, 'block', 'the message shows');
  assert.equal(feedbackOf(search).textContent, 'Будь ласка, заповніть це поле',
    'without a field-level message the form-wide settings.required.message wins');

  const hselect = document.querySelector('select[data-location-field="hromada"]');
  fire(window, hselect, 'blur');
  await flush();
  assert.equal(hselect.classList.contains('is-invalid'), true, 'an empty required hromada errors on blur');
  assert.equal(feedbackOf(hselect).textContent, 'Оберіть громаду',
    'field.message outranks the form-wide settings.required.message');

  const oselect = document.querySelector('select[data-location-field="oblast"]');
  fire(window, oselect, 'blur');
  await flush();
  assert.equal(oselect.classList.contains('is-invalid'), false, 'a filled sub-field never errors on blur');
  assert.equal(feedbackOf(oselect).style.display, 'none', 'a filled sub-field shows no feedback');
});

test('blurring a live query without a pick marks the required field invalid', async () => {
  const { window, document } = mountMethodTwo();
  const app = await bootLocation(document);
  assert.ok(app, 'wireAddProperty must boot');

  const search = document.querySelector('input[data-location-search="settlement"]');
  assert.ok(search, 'the settlement search control must be mounted');

  search.value = 'ів';
  fire(window, search, 'input');
  await flush();
  assert.equal(search.classList.contains('is-invalid'), false, 'a live query with matches stays neutral while typing');
  assert.equal(feedbackOf(search).style.display, 'none', 'no feedback while a query with candidates is typed');

  fire(window, search, 'blur');
  await tick(20); await flush();
  assert.equal(search.classList.contains('is-invalid'), true, 'blur without a pick marks the required sub-field invalid');
  assert.equal(search.classList.contains('is-valid'), false, 'an uncommitted query is never valid');
  assert.equal(feedbackOf(search).textContent, 'Будь ласка, заповніть це поле', 'the blur reports the required message');
  assert.equal(feedbackOf(search).style.display, 'block', 'the required feedback shows after blur');
});

test('an unpicked required location sub-field keeps Next disabled until the chain is complete', async () => {
  const { window, document } = mountMethodTwo();
  const app = await bootLocation(document);
  const ctl = app.controller;
  assert.ok(app, 'wireAddProperty must boot');

  const nextBtn = document.querySelector('[data-step-next]');
  assert.ok(nextBtn, 'the next button must be mounted');

  ctl.setStep(3);
  await flush();
  const ac = mountAutocomplete(document);
  const { opt } = uniqueOption(ac.options);
  ctl.setData(ac.name, String(opt.id));
  ctl.setData('name_address', 'Бандери');
  ctl.setData('house_address', '16');
  await flush(); await flush();
  assert.equal(ctl.getValue(ac.name), String(opt.id), 'the step address fields must be filled for the test');
  assert.equal(nextBtn.disabled, true, 'a filled step still cannot advance past an unpicked required location');

  const search = document.querySelector('input[data-location-search="settlement"]');
  search.value = 'Івано-Франківськ';
  fire(window, search, 'input');
  await flush();
  const dropdown = document.querySelector('[data-location-dropdown="settlement"]');
  const target = itemWith(dropdown, 'Івано-Франківськ');
  assert.ok(target, 'the settlement dropdown must offer Івано-Франківськ');
  target.dispatchEvent(new window.Event('mousedown', { bubbles: true, cancelable: true }));
  await flush(); await flush(); await flush();
  assert.ok(String(locValue(ctl, document, 'settlement')), 'the leaf pick is stored');
  assert.equal(nextBtn.disabled, false, 'completing the location enables Next');
});

test('the summary renders the legacy locationSummary format', async () => {
  const { window, document } = mountMethodTwo();
  const app = await bootLocation(document);
  assert.ok(app, 'wireAddProperty must boot');

  const box = document.querySelector('[data-location-summary]');
  const panel = box.closest('[data-location-summary-panel]');
  assert.ok(box && panel, 'the summary panel must be mounted');
  assert.equal(panel.hidden, true, 'the panel stays hidden without a leaf value');

  const search = document.querySelector('input[data-location-search="settlement"]');
  search.value = 'Івано-Франківськ';
  fire(window, search, 'input');
  await flush();
  const dropdown = document.querySelector('[data-location-dropdown="settlement"]');
  const target = itemWith(dropdown, 'Івано-Франківськ');
  assert.ok(target, 'the settlement dropdown must offer Івано-Франківськ');
  target.dispatchEvent(new window.Event('mousedown', { bubbles: true, cancelable: true }));
  await flush(); await flush();

  assert.equal(panel.hidden, false, 'the panel shows once the leaf is set');
  assert.equal(box.textContent,
    'Івано-Франківська, Івано-Франківський, Івано-Франківська громада територіальна громада, місто Івано-Франківськ, Україна',
    'leaf as "type name", the hromada row cleaned like legacy, the country pinned at the end');
});

test('an unrelated controller change keeps an in-progress location query', async () => {
  const { window, document } = mountMethodTwo();
  const app = await bootLocation(document);
  assert.ok(app, 'wireAddProperty must boot');

  const search = document.querySelector('input[data-location-search="settlement"]');
  const clearBtn = document.querySelector('[data-location-clear="settlement"]');
  assert.ok(search && clearBtn, 'the settlement chrome must be mounted');

  search.value = 'Івано';
  fire(window, search, 'input');
  await flush();
  assert.equal(search.value, 'Івано', 'the typed query is in place');

  app.controller.setData('action_type', 'rent');
  await flush();
  assert.equal(search.value, 'Івано', 'an unrelated controller change must not wipe the typed query');
  assert.equal(clearBtn.hidden, false, 'the clear button follows the surviving text');
});