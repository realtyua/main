import test from 'node:test';
import assert from 'node:assert/strict';

import { parseHTML } from 'linkedom';

import { FormRender } from '../assets/js/form-engine/render.js';

// One config must produce one contract in both themes. Presentation may differ,
// but the ids the labels point at, the data-* hooks the controller/binder/page
// glue select, the neutral class hooks, the chrome and the validation
// vocabulary must not. This file owns that contract; the pivot it protects is
// JEK-E3 / theme-neutral-hooks.md §9.

const THEMES = ['bootstrap4', 'tailwind'];

// Every field type and all four widgets, so a new renderer cannot land in one
// theme only. The config is deliberately a rendering fixture: it is never
// validated against the schema and never booted.
const CONFIG = {
  version: 1,
  id: 'parity',
  settings: {
    required: { marker: '*', tooltip: 'required', message: 'fill', class: 'text-danger small' },
    feedback: { valid: 'ok', invalid: 'bad', pattern: 'letters only' },
  },
  steps: [
    {
      id: 'fields',
      title: 'Поля',
      class: 'h3',
      rows: [
        {
          class: 'row',
          fields: [
            { name: 'text', type: 'text', label: 'Text', required: true, helper: 'h', placeholder: 'p', autocomplete: 'off' },
            { name: 'tel', type: 'tel', label: 'Tel' },
            { name: 'email', type: 'email', label: 'Email' },
            { name: 'number', type: 'number', label: 'Number', prepend: { text: 'м²' }, append: { text: '≈' } },
            { name: 'textarea', type: 'textarea', label: 'Textarea', maxlength: 100, rows: 3 },
            { name: 'select', type: 'select', label: 'Select', placeholder: 'pick', options: [{ value: 'a', label: 'A' }, { value: 'b' }] },
            { name: 'checkbox', type: 'checkbox', label: 'Checkbox' },
            { name: 'checkbox_group', type: 'checkbox_group', label: 'Checks', options: [{ value: 'x', label: 'X' }, { value: 'y', label: 'Y' }] },
            { name: 'radio', type: 'radio', label: 'Radio' },
            { name: 'hidden', type: 'hidden' },
            {
              name: 'file',
              type: 'file',
              label: 'File',
              accept: 'image/*',
              multiple: true,
              helper: 'Додайте фото',
              file: { minFiles: 1, maxFiles: 3, maxSize: '1MB' },
            },
            {
              name: 'ac',
              type: 'autocomplete',
              label: 'AC',
              placeholder: 'type',
              minChars: 2,
              maxResults: 5,
              data: [{ value: 'street', label: 'вулиця' }, { value: 'lane', label: 'провулок' }],
            },
          ],
        },
        {
          class: 'row',
          fields: [
            { name: 'heading', type: 'heading', label: 'Heading', level: 3 },
            { name: 'paragraph', type: 'paragraph', label: '*Text*', markdown: true },
            { name: 'list', type: 'list', items: ['one', 'two'] },
            { name: 'alert', type: 'alert', label: 'Alert', variant: 'warning', dismissible: true },
            { name: 'badge', type: 'badge', label: 'Badge', variant: 'success', pill: true },
            { name: 'image', type: 'image', src: '/x.jpg', alt: 'X', caption: 'Cap' },
            { name: 'raw', type: 'raw', html: '<span>raw</span>' },
          ],
        },
      ],
    },
    {
      id: 'widgets',
      title: 'Віджети',
      rows: [{
        class: 'row',
        fields: [
          {
            name: 'captcha',
            type: 'widgets',
            widget: 'captcha',
            element_id: 'captcha',
            label: 'Captcha',
            required: true,
            theme: 'light',
            size: 'normal',
            appearance: 'always',
          },
          { name: 'map_widget', type: 'widgets', widget: 'map', label: 'Map' },
          { name: 'price_info_widget', type: 'widgets', widget: 'price_info' },
          {
            name: 'location_widget',
            type: 'widgets',
            widget: 'location',
            label: 'Loc',
            fields: [
              { name: 'oblast', label: 'Область' },
              { name: 'settlement', label: 'Населений пункт' },
            ],
          },
        ],
      }],
    },
  ],
};

const render = (theme) => FormRender.render(CONFIG, { theme });

const idsOf = (html) => {
  const { document } = parseHTML(`<div>${html}</div>`);
  return [...document.querySelectorAll('[id]')]
    .map((el) => el.getAttribute('id'))
    .sort();
};

const dataOf = (html) => {
  const { document } = parseHTML(`<div>${html}</div>`);
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    for (const name of el.getAttributeNames()) {
      if (name.startsWith('data-')) out.push(`${name}=${el.getAttribute(name)}`);
    }
  }
  return out.sort();
};

const classTokensOf = (html) => {
  const out = new Set();
  for (const m of html.matchAll(/\bclass="([^"]*)"/g)) {
    for (const token of m[1].split(/\s+/)) if (token) out.add(token);
  }
  return out;
};

// Alpine framework attributes never belong in a baked page: the engine replaced
// them with the controller/binder. Both themes must stay clean.
const ALPINE = /\b(x-[a-z-]+|@[a-z]+(\.[a-z0-9]+)*|:[a-z-]+)=/;

// Neutral class hooks page-form.js/binder.js select by name. They are the glue
// contract, not presentation, so both themes must emit every one of them.
const NEUTRAL_HOOKS = [
  'custom-file', 'custom-file-label', 'file-previews',
  'dropdown-menu', 'dropdown-item', 'dropdown-item-empty',
  'position-relative', 'location-search-icon', 'autocomplete-search-icon',
  'captcha-widget', 'alert', 'alert-info', 'map-marker-info',
  'invalid-feedback', 'valid-feedback',
];

// Bootstrap-only presentation that must not survive in the Tailwind render.
// Hook classes (`custom-file`, `alert-info`, `position-relative`, ...) are
// deliberately absent - they are intentional and asserted positive above.
const BOOTSTRAP_PRESENTATION = [
  'form-group', 'form-control', 'input-group', 'custom-control', 'badge-',
  'btn btn-', 'btn-primary', 'btn-outline-', 'text-muted', 'text-danger',
  'img-fluid', 'spinner-border', 'figure-caption', 'bg-warning', 'text-success',
];

const chromeOf = (themeName, steps, copy = {}) =>
  FormRender.theme(themeName).chrome({ steps, copy });

test('both themes expose the same theme interface', () => {
  const bs = FormRender.theme('bootstrap4');
  const tw = FormRender.theme('tailwind');
  assert.deepEqual(Object.keys(bs).sort(), Object.keys(tw).sort(),
    'a theme that adds/removes an interface member breaks the shell contract');
  assert.equal(bs.name, 'bootstrap4');
  assert.equal(tw.name, 'tailwind');
});

test('the same config renders the same ids in both themes', () => {
  const bs = idsOf(render('bootstrap4'));
  const tw = idsOf(render('tailwind'));
  assert.ok(bs.length > 20, `the fixture must exercise a broad render, got ${bs.length} ids`);
  assert.deepEqual(tw, bs, 'every id must match, including label/control pairs');
});

test('the same config renders the same data-* hooks in both themes', () => {
  const bs = dataOf(render('bootstrap4'));
  const tw = dataOf(render('tailwind'));
  assert.ok(bs.length > 20, `the fixture must exercise a broad render, got ${bs.length} data hooks`);
  assert.deepEqual(tw, bs, 'every data-* hook the glue selects must match');
});

test('both themes emit every neutral glue hook class', () => {
  const bs = classTokensOf(render('bootstrap4'));
  const tw = classTokensOf(render('tailwind'));

  for (const hook of NEUTRAL_HOOKS) {
    assert.ok(bs.has(hook), `bootstrap4 keeps the ${hook} hook`);
    assert.ok(tw.has(hook), `tailwind keeps the ${hook} hook`);
  }

  // Sanity: the fixture really is a Bootstrap4 render, not an empty shell.
  for (const token of ['form-group', 'form-control', 'custom-control']) {
    assert.ok(bs.has(token), `bootstrap4 emits ${token}`);
  }
});

test('tailwind does not leak bootstrap presentation, bootstrap4 does not leak alpine', () => {
  const bsHtml = render('bootstrap4');
  const twHtml = render('tailwind');

  const leaked = BOOTSTRAP_PRESENTATION.find((token) => twHtml.includes(token));
  assert.equal(leaked, undefined, `bootstrap class leaked in tailwind output: ${leaked || ''}`);

  assert.ok(!ALPINE.test(bsHtml), `bootstrap4 leaked an alpine attribute: ${bsHtml.match(ALPINE)?.[0]}`);
  assert.ok(!ALPINE.test(twHtml), `tailwind leaked an alpine attribute: ${twHtml.match(ALPINE)?.[0]}`);
});

test('chrome renders the same step, navigation and submit contract in both themes', () => {
  const steps = [
    { title: 'Один', class: 'h2' },
    { title: 'Два', class: 'h3' },
    { title: 'Три' },
  ];

  for (const theme of THEMES) {
    const chrome = chromeOf(theme, steps);
    assert.equal(typeof chrome.top, 'string', `${theme} chrome.top must be a string`);
    assert.equal(typeof chrome.bottom, 'string', `${theme} chrome.bottom must be a string`);

    const { document } = parseHTML(`<div id="chrome-root">${chrome.top}${chrome.bottom}</div>`);
    const one = (selector) => document.querySelectorAll(selector).length;

    assert.equal(one('[data-step-indicator]'), 1, `${theme}: one step indicator`);
    assert.equal(one('[data-step-prev]'), 1, `${theme}: one previous button`);
    assert.equal(one('[data-step-next]'), 1, `${theme}: one next button`);
    assert.equal(one('[data-submit]'), 1, `${theme}: one submit button`);
    assert.equal(one('[data-submit-label]'), 1, `${theme}: one submit label`);
    assert.equal(one('[data-submit-busy]'), 1, `${theme}: one busy label`);
    assert.equal(one('[data-submitted-block]'), 1, `${theme}: one submitted block`);
    assert.equal(one('[data-error-block]'), 1, `${theme}: one error block`);

    const navs = [...document.querySelectorAll('[data-step-nav]')];
    assert.deepEqual(navs.map((n) => Number(n.getAttribute('data-step-nav'))).sort(), [1, 2, 3],
      `${theme}: one chip per step`);
    assert.equal(navs[0].textContent.trim(), '1');

    const titles = [...document.querySelectorAll('[data-step-title]')];
    assert.equal(titles.length, steps.length, `${theme}: one title per step`);
    for (let i = 0; i < steps.length; i++) {
      const title = titles.find((t) => Number(t.getAttribute('data-step-title')) === i + 1);
      assert.ok(title, `${theme}: step title ${i + 1} exists`);
      assert.equal(title.textContent, steps[i].title, `${theme}: step title ${i + 1} copy`);
      assert.equal(title.hidden, i !== 0, `${theme}: only the first title is visible at step 1`);
    }
  }
});

test('chrome honours the supplied copy and paints chips from its own nav tokens', () => {
  const steps = [{ title: 'A' }, { title: 'B' }];
  const copy = {
    previous: 'PREV', next: 'NEXT', submit: 'SEND', sending: 'BUSY',
    successTitle: 'OK_TITLE', successText: 'OK_TEXT',
    errorTitle: 'ERR_TITLE', errorCode: 'CODE', retry: 'RETRY',
  };

  for (const theme of THEMES) {
    const html = (() => {
      const chrome = chromeOf(theme, steps, copy);
      return chrome.top + chrome.bottom;
    })();

    for (const value of Object.values(copy)) {
      assert.ok(html.includes(value), `${theme}: chrome copy "${value}" must reach the output`);
    }

    const tokens = FormRender.theme(theme).navTokens;
    const { document } = parseHTML(`<div>${html}</div>`);
    const navs = [...document.querySelectorAll('[data-step-nav]')];
    for (const token of tokens.current) {
      assert.ok(navs[0].classList.contains(token), `${theme}: the current chip carries ${token}`);
    }
    for (const token of tokens.todo) {
      assert.ok(navs[1].classList.contains(token), `${theme}: a future chip carries ${token}`);
    }
  }
});

test('validationClasses and navTokens expose one shared contract', () => {
  const bs = FormRender.theme('bootstrap4');
  const tw = FormRender.theme('tailwind');

  assert.deepEqual(tw.validationClasses, bs.validationClasses,
    'the binder and page glue must see the same invalid/valid vocabulary');
  assert.deepEqual(Object.keys(bs.validationClasses).sort(), ['invalid', 'valid']);
  for (const theme of [bs, tw]) {
    assert.ok(theme.validationClasses.invalid, `${theme.name}: invalid class is set`);
    assert.ok(theme.validationClasses.valid, `${theme.name}: valid class is set`);
    assert.notEqual(theme.validationClasses.invalid, theme.validationClasses.valid,
      `${theme.name}: invalid and valid must differ`);
  }

  // Chip classes are presentation tokens supplied by each theme through the
  // island, so the contract is the shape, not the literal colours (audit §7).
  assert.deepEqual(Object.keys(tw.navTokens).sort(), Object.keys(bs.navTokens).sort());
  assert.deepEqual(Object.keys(bs.navTokens).sort(), ['current', 'done', 'todo']);
  for (const theme of [bs, tw]) {
    for (const key of ['current', 'done', 'todo']) {
      const list = theme.navTokens[key];
      assert.ok(Array.isArray(list) && list.length > 0, `${theme.name}: navTokens.${key} is a non-empty list`);
      for (const token of list) assert.equal(typeof token, 'string', `${theme.name}: navTokens.${key} holds strings`);
    }
  }
});
