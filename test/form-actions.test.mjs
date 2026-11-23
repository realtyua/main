// MOD-11: the site's page and modal forms use one submit/reset/cancel contract.
// The neutral hooks replace notify-only ids without dropping legacy aliases.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseHTML } from 'linkedom';

import { boot } from '../assets/js/form-engine/app.js';
import { bootModal } from '../assets/js/form-engine/modal-form.js';
import { ensureSubmitButton } from '../assets/js/form-engine/form-runtime.js';
import { renderPage } from '../assets/js/form-engine/shell.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const click = (window, node) => node.dispatchEvent(new window.Event('click', { bubbles: true, cancelable: true }));

function modalConfig(overrides = {}) {
  return {
    version: 1,
    id: 'demo',
    theme: 'bootstrap4',
    behavior: { mode: 'modal', modal: '#demo-dialog', ...(overrides.behavior || {}) },
    chrome: { submit: 'Надіслати', sending: 'Надсилаю...', ...(overrides.chrome || {}) },
    submit: { action: '/api/demo' },
    steps: [{ id: 'main', rows: [{ fields: [{ name: 'reference', type: 'text', label: 'Ref' }] }] }],
    ...overrides,
  };
}

function mountModal({ config, extra = '' }) {
  const island = JSON.stringify(config).replace(/</g, '\\u003c');
  const html = `<!doctype html><html><body>
    <div class="modal" id="demo-dialog">
      <script id="demo-config" type="application/json">${island}</script>
      <div id="demo-app" data-endpoint="/api/demo"></div>
      <div data-form-error class="d-none"></div>
      <div data-form-success class="d-none"></div>
      ${extra}
    </div>
  </body></html>`;
  const { window } = parseHTML(html);
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.Element = window.Element;
  globalThis.Event = window.Event;
  return { window, document: window.document };
}

function bootDemo(document, opts = {}) {
  return bootModal(document, {
    name: 'demo',
    Captcha: null,
    fetch: opts.fetch || (() => Promise.resolve({ ok: true, json: async () => ({ success: true }) })),
    setTimeout: () => 0,
    ...opts,
  });
}

test('a modal without submit markup gets a generated action button and submits once', async () => {
  const { window, document } = mountModal({ config: modalConfig() });
  const calls = [];
  let release;
  const fetchImpl = (url, init) => {
    calls.push({ url, init });
    return new Promise((resolve) => { release = () => resolve({ ok: true, json: async () => ({ success: true }) }); });
  };
  const handle = bootDemo(document, { fetch: fetchImpl });
  assert.ok(handle);

  const button = document.querySelector('[data-form-action="submit"]');
  assert.ok(button, 'the engine must generate a submit action');
  assert.equal(button.type, 'button', 'a generated action never relies on native submit');
  assert.equal(button.getAttribute('data-form-submit'), '', 'the older hook stays an alias');
  assert.equal(button.querySelector('[data-action-label]').textContent, 'Надіслати');

  click(window, button);
  assert.equal(button.disabled, true, 'shared busy state disables the action');
  assert.equal(button.getAttribute('aria-busy'), 'true');
  assert.equal(button.getAttribute('data-action-state'), 'busy');
  assert.equal(button.querySelector('[data-action-busy]').hidden, false);
  assert.equal(calls.length, 1, 'one click runs the pipeline exactly once');

  release();
  await flush(); await flush();
  assert.equal(calls[0].url, '/api/demo');
  assert.equal(JSON.parse(calls[0].init.body).reference, '');
  assert.equal(button.disabled, false, 'the action is restored after the reply');
  assert.equal(button.getAttribute('data-action-state'), 'idle');
});

test('behavior.actions.submit uses a custom control instead of generating one', async () => {
  const config = modalConfig({ behavior: { mode: 'modal', modal: '#demo-dialog', actions: { submit: '#custom-send' } } });
  const { window, document } = mountModal({
    config,
    extra: '<button id="custom-send" type="submit">Відправити</button>',
  });
  const calls = [];
  const handle = bootDemo(document, {
    fetch: (url, init) => { calls.push({ url, init }); return Promise.resolve({ ok: true, json: async () => ({ success: true }) }); },
  });
  assert.ok(handle);
  assert.equal(document.querySelectorAll('[data-form-action="submit"]').length, 0,
    'an explicit control suppresses default generation');
  const custom = document.getElementById('custom-send');
  assert.equal(custom.hasAttribute('data-action-state'), false);

  click(window, custom);
  await flush(); await flush();
  assert.equal(calls.length, 1, 'the custom button submits once, without a native double-fire');
  assert.equal(custom.getAttribute('data-action-state'), 'idle');
  assert.equal(custom.textContent, 'Відправити', 'a hookless custom button keeps its own copy');
});

test('reset and cancel resolve from neutral hooks in the modal profile', async () => {
  const config = modalConfig({ behavior: { mode: 'modal', modal: '#demo-dialog', events: { hide: 'form-engine:hide' } } });
  const { window, document } = mountModal({
    config,
    extra: '<button type="button" data-form-action="reset">Скинути</button>' +
      '<button type="button" data-form-action="cancel">Закрити</button>',
  });
  let hidden = 0;
  document.getElementById('demo-dialog').addEventListener('form-engine:hide', () => { hidden += 1; });
  const handle = bootDemo(document);
  assert.ok(handle);

  handle.controller.setData('reference', 'value');
  document.querySelector('[data-form-error]').classList.remove('d-none');
  click(window, document.querySelector('[data-form-action="reset"]'));
  assert.equal(handle.controller.getValue('reference'), '', 'reset restores the boot value');
  assert.ok(document.querySelector('[data-form-error]').classList.contains('d-none'));

  click(window, document.querySelector('[data-form-action="cancel"]'));
  assert.equal(hidden, 1, 'cancel fires the configured hide event on the modal');
});

test('the page profile keeps the wizard submit contract with shared action state', async () => {
  const config = {
    version: 1,
    id: 'wizard',
    theme: 'bootstrap4',
    behavior: { mode: 'page' },
    submit: { action: '/api/wizard' },
    steps: [{ id: 'main', title: 'Крок', rows: [{ fields: [{ name: 'reference', type: 'text', label: 'Ref' }] }] }],
  };
  const html = renderPage(config, { name: 'wizard', endpoint: '/api/wizard' });
  const { window } = parseHTML(html);
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.Element = window.Element;
  globalThis.Event = window.Event;
  const calls = [];
  const handles = boot(window.document, {
    Captcha: null,
    leaflet: null,
    setTimeout: () => 0,
    setInterval: () => 0,
    fetch: (url, init) => { calls.push({ url, init }); return Promise.resolve({ ok: true, json: async () => ({ success: true }) }); },
  });
  assert.equal(handles.length, 1);
  const page = handles[0];
  page.controller.setData('reference', 'P-11');
  const submit = window.document.querySelector('[data-submit]');
  assert.ok(submit, 'theme chrome still provides the page submit action');

  click(window, submit);
  await flush(); await flush();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/wizard');
  assert.ok(calls[0].init.body instanceof window.FormData);
  assert.match(calls[0].init.body.get('data') || '', /P-11/);
  assert.equal(submit.getAttribute('data-action-state'), 'idle');
});

test('generated actions follow the theme vocabulary and copy overrides', () => {
  const { window } = parseHTML('<!doctype html><html><body><form id="f"></form></body></html>');
  const form = window.document.getElementById('f');
  const config = { theme: 'tailwind', chrome: { actions: { submit: 'Send' } } };
  const button = ensureSubmitButton(form, config, 'tailwind');
  assert.equal(button.querySelector('[data-action-label]').textContent, 'Send');
  assert.match(button.className, /bg-green-600/);
  assert.doesNotMatch(button.className, /btn btn-success/);
});

test('the baked notify modal carries the neutral action hooks with legacy aliases', () => {
  const baked = readFileSync(join(ROOT, '_includes', 'form', 'app', 'notify.html'), 'utf8');
  // The button lives inside the escaping config island, so its markup is JSON-escaped.
  assert.match(baked, /data-form-action=\\"submit\\"/);
  assert.match(baked, /data-submit-label/);
  assert.match(baked, /data-submit-busy/);

  const shell = readFileSync(join(ROOT, '_includes', 'modals', 'notify-property.html'), 'utf8');
  assert.match(shell, /data-form-action="cancel"/);
  assert.match(shell, /data-dismiss="modal"/);
});
