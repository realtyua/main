function sanitize(value) {
  return String(value == null ? '' : value)
    .replace(/<[^>]*>/g, '')
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function matchesValues(dataValue, values, except) {
  const hasValues = Array.isArray(values) && values.length > 0;
  const hasExcept = Array.isArray(except) && except.length > 0;
  if (!hasValues && !hasExcept) return true;

  const listed = (list) =>
    list.some((v) => dataValue === v || String(dataValue) === String(v));

  if (hasValues) {
    const inValues = listed(values);
    if (hasExcept && listed(except)) return false;
    return inValues;
  }
  if (listed(except)) return false;
  return dataValue !== '' && dataValue !== null;
}

function dataGet(data, path) {
  if (!path) return null;
  if (String(path).indexOf('.') === -1) {
    return Object.prototype.hasOwnProperty.call(data, path) ? data[path] : null;
  }
  let cur = data;
  for (const part of String(path).split('.')) {
    if (cur === null || typeof cur !== 'object' || !Object.prototype.hasOwnProperty.call(cur, part)) {
      return null;
    }
    cur = cur[part];
  }
  return cur;
}

function depValue(data, dep) {
  if (!dep || !dep.field) return null;
  return dataGet(data, dep.field);
}

function matchesValueCondition(dataValue, condition) {
  if (typeof condition === 'number') {
    return !isNaN(parseFloat(dataValue)) && parseFloat(dataValue) === condition;
  }
  if (typeof condition !== 'string') return false;

  const normalized = condition.replace(/&gt;/g, '>').replace(/&lt;/g, '<');
  const m = normalized.match(/^\s*([><=!]+)\s*(\d+\.?\d*)\s*$/);
  if (!m) return false;

  const num = parseFloat(dataValue);
  const op = m[1];
  const val = parseFloat(m[2]);
  if (isNaN(num)) {
    if (op === '>' && val === 0) return dataValue !== '' && dataValue !== null;
    return false;
  }
  switch (op) {
    case '>': return num > val;
    case '>=': return num >= val;
    case '<': return num < val;
    case '<=': return num <= val;
    case '==': return num === val;
    case '!=': return num !== val;
  }
  return false;
}

function checkWhen(when, data) {
  if (!when) return true;
  const dataVal = dataGet(data, when.field);
  if (Array.isArray(when.values) && when.values.length > 0) {
    return when.values.some((v) => dataVal === v || String(dataVal) === String(v));
  }
  if (Object.prototype.hasOwnProperty.call(when, 'value')) {
    return matchesValueCondition(dataVal, when.value);
  }
  return true;
}

function evaluateDepends(deps, data) {
  if (!Array.isArray(deps) || deps.length === 0) return true;
  const mode = deps.some((d) => d && d.logic === 'or') ? 'or' : 'and';

  if (mode === 'or') {
    for (const d of deps) {
      if (!d) continue;
      if (!checkWhen(d.when, data)) continue;
      if (matchesValues(depValue(data, d), d.values, d.except)) return true;
    }
    return false;
  }
  for (const d of deps) {
    if (!d) continue;
    if (!checkWhen(d.when, data)) continue;
    if (!matchesValues(depValue(data, d), d.values, d.except)) return false;
  }
  return true;
}

function isFieldVisible(field, data) {
  return evaluateDepends(field.depends, data);
}

function isFieldRequired(field, data) {
  const r = field.required;
  if (r === true) return true;
  if (Array.isArray(r)) return evaluateDepends(r, data);
  if (isMap(r)) {
    if (Array.isArray(r.depends)) return evaluateDepends(r.depends, data);
    return evaluateDepends(r, data);
  }
  return false;
}

function isEmptyValue(val) {
  return val === '' || val === null || val === undefined || val === false || (Array.isArray(val) && val.length === 0);
}

function isMap(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function fieldLabel(field, data) {
  const label = field.label;
  if (typeof label === 'string') return label;
  if (isMap(label)) {
    if (Array.isArray(label.depends)) {
      for (const d of label.depends) {
        if (matchesValues(depValue(data, d), d.values, d.except) && d.text) return d.text;
      }
    }
    if (label.text) return label.text;
  }
  return '';
}

function requiredMessage(field, data, settings) {
  const v = field.validation;
  if (isMap(v) && Object.prototype.hasOwnProperty.call(v, 'required')) {
    const req = v.required;
    if (typeof req === 'string') return req;
    if (isMap(req) && req.text) {
      if (Array.isArray(req.depends)) {
        for (const d of req.depends) {
          if (matchesValues(depValue(data, d), d.values, d.except) && d.text) return d.text;
        }
      }
      return req.text;
    }
  }
  if (typeof field.message === 'string') return field.message;
  if (settings && settings.required && typeof settings.required.message === 'string') {
    return settings.required.message;
  }
  return "Поле обов'язкове";
}

function optionLabel(field, value) {
  const opts = field.options;
  if (Array.isArray(opts)) {
    for (const o of opts) {
      if (o && String(o.value) === String(value)) return o.label != null ? o.label : value;
    }
  }
  return value;
}

function formatValue(field, value) {
  if (typeof value === 'boolean') return value ? 'так' : 'ні';
  if (Array.isArray(value)) return value.map((v) => optionLabel(field, v)).join(', ');
  const type = field.type || '';
  if ((type === 'select' || type === 'radio') && field.options && field.options.length) {
    return optionLabel(field, value);
  }
  return value;
}

function locationVal(data, root, key) {
  if (
    root && data[root] && typeof data[root] === 'object' &&
    Object.prototype.hasOwnProperty.call(data[root], key)
  ) {
    return data[root][key];
  }
  return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
}

function locationDisplay(data, name, root) {
  const id = locationVal(data, root, name);
  const nameVal = locationVal(data, root, name + 'Name');
  if (nameVal === '' || nameVal === null) return id;
  const typeVal = locationVal(data, root, name + 'Type');
  return (typeVal !== '' && typeVal !== null ? typeVal + ' ' : '') + nameVal;
}

function carriesData(field) {
  return ['alert', 'paragraph', 'widgets', 'checkbox', 'file'].indexOf(field.type || '') === -1;
}

export function validateManifest(manifest, data) {
  const fields = Array.isArray(manifest.fields) ? manifest.fields : [];
  const settings = manifest.settings || {};
  const locRoot = manifest.locationWidget || 'location_widget';

  const location = {};
  if (Array.isArray(manifest.location)) {
    for (const lc of manifest.location) {
      if (lc && lc.name) location[lc.name] = lc;
    }
  }

  const errors = {};
  for (const field of fields) {
    const name = field.name;
    if (!name) continue;
    if ((field.type || '') === 'file') continue;
    if (!isFieldVisible(field, data)) continue;
    if (!isFieldRequired(field, data)) continue;
    let val = data[name];
    if (field.widget === 'map') val = data.lat ? data.lat : null;
    if (isEmptyValue(val)) errors[name] = requiredMessage(field, data, settings);
  }
  for (const name of Object.keys(location)) {
    if (!isFieldRequired(location[name], data)) continue;
    if (isEmptyValue(locationVal(data, locRoot, name))) {
      errors[name] = requiredMessage(location[name], data, settings);
    }
  }

  return {
    errors,
    fields,
    location,
    settings,
    locRoot,
    isFieldVisible,
    isEmptyValue,
    carriesData,
    fieldLabel,
    formatValue,
    locationVal,
    locationDisplay,
    sanitize,
  };
}

export function buildSubmissionBody(manifest, data) {
  const ctx = validateManifest(manifest, data);
  const lines = [];

  for (const field of ctx.fields) {
    if (!field.name) continue;
    if (!ctx.isFieldVisible(field, data)) continue;
    if (!ctx.carriesData(field)) continue;
    const val = data[field.name];
    if (ctx.isEmptyValue(val)) continue;
    const label = ctx.fieldLabel(field, data);
    if (label === '') continue;
    lines.push(label + ': ' + ctx.sanitize(ctx.formatValue(field, val)));
  }
  for (const name of Object.keys(ctx.location)) {
    const val = ctx.locationVal(data, ctx.locRoot, name);
    if (ctx.isEmptyValue(val)) continue;
    const label = ctx.fieldLabel(ctx.location[name], data) || name;
    lines.push(label + ': ' + ctx.sanitize(ctx.locationDisplay(data, name, ctx.locRoot)));
  }
  if (data.lat && data.lng) lines.push('Координати: ' + ctx.sanitize(data.lat) + ', ' + ctx.sanitize(data.lng));
  if (data.address) lines.push('Адреса на карті: ' + ctx.sanitize(data.address));

  const subjectParts = [];
  for (const field of ctx.fields) {
    if (subjectParts.length >= 2) break;
    if (field.type !== 'select' && field.type !== 'radio') continue;
    if (!field.name) continue;
    if (!ctx.isFieldVisible(field, data)) continue;
    const val = data[field.name];
    if (ctx.isEmptyValue(val) || Array.isArray(val)) continue;
    const label = ctx.fieldLabel(field, data);
    if (label === '') continue;
    subjectParts.push(label + ': ' + ctx.formatValue(field, val));
  }
  const subject = subjectParts.length
    ? 'Нове оголошення: ' + subjectParts.join(', ')
    : 'Нове оголошення про нерухомість';

  return { lines, subject, errors: ctx.errors };
}