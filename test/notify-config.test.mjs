import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadYaml } from '../_form-engine/tools/yaml.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

import { FormRender } from '../assets/js/form-engine/render.js';

// The page glue injects the endpoint into the config; the YAML itself stays
// free of it so the same file runs on other hosts.
const config = {
  ...loadYaml(join(ROOT, '_data', 'notify.yml')),
  submit: { action: 'https://notify-worker.test/hook', method: 'POST' },
};

const html = FormRender.render(config);

const patternOf = (id) => {
  const m = html.match(new RegExp(`<input[^>]*id="field_${id}"[^>]*\\bpattern="([^"]*)"`));
  assert.ok(m, `missing pattern on input#field_${id}`);
  return m[1];
};

const ALPINE = /\b(x-[a-z]+|@[a-z]+(\.[a-z0-9]+)*|:[a-z-]+)=/;

test('notify config is version 1 modal config (target MOD-9)', () => {
  assert.equal(config.version, 1);
  assert.equal(config.id, 'notify');
  assert.equal(config.theme, 'bootstrap4');
  assert.equal(config.behavior?.mode, 'modal');
  assert.equal(config.behavior?.modal, '#notifyModal');
});

test('the form carries id, method, action, novalidate and data-form', () => {
  assert.match(html, /^<form id="notify-form" method="POST"/);
  assert.match(html, /action="https:\/\/notify-worker\.test\/hook"/);
  assert.match(html, /novalidate autocomplete="off" data-form="notify">/);
  assert.ok(!ALPINE.test(html), `framework attribute leaked: ${html.match(ALPINE)?.[0]}`);
});

test('hidden context fields and honeypot raw block are rendered', () => {
  for (const name of ['timestamp', 'uid', 'property_url', 'property_email', 'property_title']) {
    const re = new RegExp(`<input type="hidden" id="field_${name}" name="${name}"[^>]*>`);
    assert.match(html, re, `hidden ${name}`);
  }
  assert.ok(!html.includes('data-field-col="timestamp"'));
  assert.match(html, /<div class="sr-only" aria-hidden="true" style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;">/);
  assert.match(html, /<input type="text" id="notify-honeypot" name="honeypot" tabindex="-1" autocomplete="off" value="" spellcheck="false">/);
});

test('reason is a required select with configured options and feedback', () => {
  assert.match(html, /<select class="form-control" id="field_reason" name="reason"[^>]*required/);
  assert.match(html, /<option value="">Оберіть причину<\/option>/);
  for (const [value, label] of [
    ['not_actual', 'Оголошення вже не актуальне (продано/здано)'],
    ['moved_to_archive', 'Помилково переміщено в архів'],
    ['wrong_price', 'Ціна вказана неправильно'],
    ['wrong_info', 'Інформація в описі неточна'],
    ['error', 'Помилка в оголошенні (адреса, контакти тощо)'],
    ['duplicate', 'Це дублікат іншого оголошення'],
    ['other', 'Інше (напишіть нижче)'],
  ]) {
    assert.match(html, new RegExp(`<option value="${value}">${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/option>`));
  }
  assert.match(html, /class="invalid-feedback">Оберіть причину<\/div>/);
  assert.match(html, /class="valid-feedback">Причину обрано<\/div>/);
});

test('details textarea keeps configured limits, helper, counter and feedback', () => {
  assert.match(html, /<textarea class="form-control" id="field_details" name="details"[^>]*minlength="0" maxlength="256"/);
  assert.match(html, /rows="4"/);
  assert.match(html, /placeholder="Опишіть, що саме не так з оголошенням\.\.\."/);
  assert.match(html, /<small id="helper_details" class="form-text text-muted">Напишіть тут що не так з цією нерухомістю<\/small>/);
  assert.match(html, /<small class="form-text text-muted" data-char-counter="details" data-maxlength="256">/);
  assert.match(html, /class="valid-feedback">Текст введено правильно<\/div>/);
  assert.match(html, /class="invalid-feedback">Тільки українська кирилиця, цифри, пробіли та розділові знаки<\/div>/);
  assert.ok(!/textarea[^>]*\bpattern=/.test(html), 'no pattern attribute on textarea');
  assert.equal(config.steps?.[0]?.rows?.[0]?.cols?.[0]?.rows?.[2]?.fields?.[0]?.name, 'details');
});

test('contact fields render with target config constraints and layout', () => {
  assert.match(html, /<input type="text" class="form-control" id="field_contact_name" name="contact_name"[^>]*required[^>]*autocomplete="given-name"[^>]*minlength="2" maxlength="30"/);
  assert.equal(patternOf('contact_name'), "^[а-щА-ЩЬьЮюЯяЇїІіЄєҐґ&#39;]{2,30}$");

  assert.match(html, /<div class="input-group-prepend"><span class="input-group-text" id="inputGroupContact_phonePrepend">\+380<\/span><\/div>/);
  assert.match(html, /<input type="tel" class="form-control" id="field_contact_phone" name="contact_phone"[^>]*required[^>]*minlength="9" maxlength="9"/);
  assert.equal(patternOf('contact_phone'), '^([1-9]{1})([0-9]{1})([0-9]{7})$');

  assert.match(html, /<input type="email" class="form-control" id="field_contact_email" name="contact_email"[^>]*minlength="3" maxlength="254"/);
  assert.equal(patternOf('contact_email'), '^(?!.*@.*\\.(ru|su|рф|xn--p1ai|cn|ir)$).+@.+\\..+$');

  for (const name of ['contact_name', 'contact_phone', 'contact_email']) {
    assert.match(html, new RegExp(`<div class="col-12 col-md-4" data-field-col="${name}">`), `${name} keeps its configured column`);
  }
});

test('captcha is rendered as engine widget (no raw turnstile block)', () => {
  assert.match(html, /data-widget="captcha" data-widget-name="captcha"/);
  assert.match(html, /id="captcha-widget" class="captcha-widget-box"[^>]*data-captcha-field="captcha"/);
  assert.match(html, /data-captcha-theme="light" data-captcha-size="normal" data-captcha-appearance="always"/);
  assert.ok(!html.includes('<div id="turnstile-widget"'), 'no legacy raw turnstile container');
  const captcha = config.steps?.[0]?.rows?.[0]?.cols?.[0]?.rows?.[4]?.fields?.[0];
  assert.equal(captcha?.widget, 'captcha');
  assert.equal(captcha?.element_id, 'captcha');
  assert.equal(captcha?.action, 'notify_property');
  assert.equal(captcha?.token, 'cf-turnstile-response');
});

test('email field keeps dnscheck validation config', () => {
  const email = config.steps?.[0]?.rows?.[0]?.cols?.[0]?.rows?.[3]?.fields?.[2];
  assert.equal(email?.name, 'contact_email');
  assert.equal(email?.validation?.dnscheck?.value, true);
  assert.equal(email?.validation?.dnscheck?.message, 'Домен не приймає пошту або не існує');
});