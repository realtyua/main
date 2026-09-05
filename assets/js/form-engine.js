(function () {
  'use strict';

  var fieldsCache = [];
  var steps = [];
  var fieldRowMap = {};

  function getStepFields(step) {
    var allFields = [];
    if (!step.rows) return allFields;
    for (var r = 0; r < step.rows.length; r++) {
      var cols = step.rows[r].cols || [];
      for (var c = 0; c < cols.length; c++) {
        var nrows = cols[c].rows || [];
        for (var nr = 0; nr < nrows.length; nr++) {
          var rowFields = nrows[nr].fields || [];
          for (var f = 0; f < rowFields.length; f++) {
            allFields.push(rowFields[f]);
          }
        }
      }
    }
    return allFields;
  }

  function hasWidget(step, name) {
    if (!step || !step.rows) return false;
    for (var r = 0; r < step.rows.length; r++) {
      var cols = step.rows[r].cols || [];
      for (var c = 0; c < cols.length; c++) {
        var nrows = cols[c].rows || [];
        for (var nr = 0; nr < nrows.length; nr++) {
          var fields = nrows[nr].fields || [];
          for (var f = 0; f < fields.length; f++) {
            if (fields[f].type === 'widgets' && fields[f].widget === name) return true;
          }
        }
      }
    }
    return false;
  }

  function getField(name) {
    for (var i = 0; i < fieldsCache.length; i++) {
      if (fieldsCache[i].name === name) return fieldsCache[i];
    }
    return null;
  }

  function buildCache(config) {
    fieldsCache = [];
    steps = config.steps || [];
    fieldRowMap = {};
    for (var s = 0; s < steps.length; s++) {
      var step = steps[s];
      var sf = getStepFields(step);
      for (var f = 0; f < sf.length; f++) {
        fieldsCache.push(sf[f]);
      }
      if (!step.rows) continue;
      for (var r = 0; r < step.rows.length; r++) {
        var cols = step.rows[r].cols || [];
        for (var c = 0; c < cols.length; c++) {
          var nrows = cols[c].rows || [];
          for (var nr = 0; nr < nrows.length; nr++) {
            var nrow = nrows[nr];
            var names = [];
            var rowFields = nrow.fields || [];
            for (var f = 0; f < rowFields.length; f++) {
              names.push(rowFields[f].name);
            }
            for (var f = 0; f < rowFields.length; f++) {
              if (rowFields[f].name) {
                fieldRowMap[rowFields[f].name] = { auto: !!nrow.auto, siblings: names };
              }
            }
          }
        }
      }
    }
  }

  function parseGridClasses(colStr) {
    if (!colStr || typeof colStr !== 'string') return {};
    var result = {};
    var bpMap = { '': 'xs', 'sm-': 'sm', 'md-': 'md', 'lg-': 'lg', 'xl-': 'xl' };
    var regex = /col-(?:(sm-|md-|lg-|xl-))?(\d+)/g;
    var match;
    while ((match = regex.exec(colStr)) !== null) {
      var bp = bpMap[match[1] || ''] || 'xs';
      result[bp] = parseInt(match[2], 10);
    }
    return result;
  }

  function matchesValues(dataValue, values, except) {
    var hasValues = values && values.length > 0;
    var hasExcept = except && except.length > 0;
    if (!hasValues && !hasExcept) return true;
    if (hasValues) {
      var inValues = values.indexOf(dataValue) !== -1;
      if (hasExcept) return inValues && except.indexOf(dataValue) === -1;
      return inValues;
    }
    if (hasExcept) return dataValue !== '' && except.indexOf(dataValue) === -1;
    return false;
  }

  function matchesValueCondition(dataValue, condition) {
    if (typeof condition === 'number') return parseFloat(dataValue) === condition;
    if (typeof condition !== 'string') return false;
    condition = condition.replace(/&gt;/g, '>').replace(/&lt;/g, '<');
    var m = condition.match(/^\s*([><=!]+)\s*(\d+\.?\d*)\s*$/);
    if (!m) return false;
    var num = parseFloat(dataValue);
    var op = m[1], val = parseFloat(m[2]);
    if (isNaN(num)) {
      if (op === '>' && val === 0) return dataValue !== '' && dataValue !== null && dataValue !== undefined;
      return false;
    }
    switch (op) {
      case '>':  return num > val;
      case '>=': return num >= val;
      case '<':  return num < val;
      case '<=': return num <= val;
      case '==': return num === val;
      case '!=': return num !== val;
    }
    return false;
  }

  function createBase(config) {
    buildCache(config);

    var dnsTimers = {};

    var base = {
      config: config,
      errors: {},
      touched: {},
      _validatingStack: null,

      getField: function (name) { return getField(name); },

      getStepFields: function (step) { return getStepFields(step); },

      validateField: function (fieldName) {
        if (this._validatingStack && this._validatingStack.indexOf(fieldName) !== -1) return;
        var prevStack = this._validatingStack;
        this._validatingStack = (prevStack || []).concat([fieldName]);
        var field = this.getField(fieldName);
        if (!field) { this._validatingStack = prevStack; return; }
        this.touched[fieldName] = true;
        var err = this.getFieldErrors(field);
        if (err !== null) {
          if (this.errors[fieldName] !== err) {
            this.errors[fieldName] = err;
          }
        } else {
          if (this.errors[fieldName]) {
            delete this.errors[fieldName];
          }
        }
        this.errors = Object.assign({}, this.errors);
        if (!err && field.type === 'email' && field.validation && field.validation.dnscheck && field.validation.dnscheck.value && this.data[fieldName]) {
          var self = this;
          if (dnsTimers[fieldName]) clearTimeout(dnsTimers[fieldName]);
          dnsTimers[fieldName] = setTimeout(function () {
            self.checkEmailDomain(fieldName, field);
          }, 500);
        }
        this.clearHiddenErrors();
        this.applySetRules();
        for (var i = 0; i < fieldsCache.length; i++) {
          var otherField = fieldsCache[i];
          if (otherField.name === fieldName) continue;
          if (!this.touched[otherField.name]) continue;
          var otherValidation = otherField.validation && otherField.validation.compare;
          if (otherValidation && Array.isArray(otherValidation)) {
            for (var r = 0; r < otherValidation.length; r++) {
              var rule = otherValidation[r];
              var fieldsToCheck = Array.isArray(rule.field) ? rule.field : [rule.field];
              if (fieldsToCheck.indexOf(fieldName) !== -1) {
                this.validateField(otherField.name);
                break;
              }
            }
          }
        }
        this._validatingStack = prevStack;
      },

      checkEmailDomain: function (fieldName, field) {
        var self = this;
        var val = this.data[fieldName];
        if (!val || val.indexOf('@') <= 0) return;
        var domain = val.split('@')[1];
        if (!domain) return;
        var msg = (field.validation && field.validation.dnscheck && field.validation.dnscheck.message) || 'Домен не приймає пошту або не існує';
        var opts = { headers: { 'Accept': 'application/dns-json' } };
        var base = 'https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(domain) + '&type=';
        Promise.all([
          fetch(base + 'MX', opts),
          fetch(base + 'A', opts),
          fetch(base + 'AAAA', opts)
        ]).then(function (responses) {
          return Promise.all(responses.map(function (r) { return r.json(); }));
        }).then(function (results) {
          var hasMX = results[0].Answer && results[0].Answer.length > 0;
          var hasA  = results[1].Answer && results[1].Answer.length > 0;
          var hasAAAA = results[2].Answer && results[2].Answer.length > 0;
          if (!hasMX && !hasA && !hasAAAA) {
            self.errors[fieldName] = msg;
            self.errors = Object.assign({}, self.errors);
          }
        }).catch(function () {});
      },

      clearHiddenErrors: function () {
        var changed = false;
        for (var i = 0; i < fieldsCache.length; i++) {
          var name = fieldsCache[i].name;
          if (!this.isFieldVisible(name)) {
            if (this.errors[name]) { delete this.errors[name]; changed = true; }
            if (this.touched[name]) { this.touched[name] = false; changed = true; }
          }
        }
        if (changed) this.errors = Object.assign({}, this.errors);
      },

      getValidationMsg: function (f, key, defKey, hardcoded) {
        if (key === 'required') {
          var r = f.required;
          if (r && typeof r === 'object' && !Array.isArray(r) && r.message) return r.message;
          if (r && typeof r === 'object' && !Array.isArray(r) && r.depends) {
            for (var i = 0; i < r.depends.length; i++) {
              var d = r.depends[i];
              if (d.message && matchesValues(this.data[d.field], d.values, d.except)) return d.message;
            }
          }
        }
        var val = f.validation && f.validation[key];
        if (typeof val === 'string') return val;
        if (val && val.depends) {
          for (var i = 0; i < val.depends.length; i++) {
            var d = val.depends[i];
            if (matchesValues(this.data[d.field], d.values, d.except)) return d.text;
          }
          return val.text;
        }
        if (key === 'required' && f.message) return f.message;
        var def = (this.config && this.config.settings && this.config.settings.validation) || {};
        if (key === 'required') {
          var settingsMsg = this.config && this.config.settings && this.config.settings.required && this.config.settings.required.message;
          if (settingsMsg) return settingsMsg;
        }
        return def[defKey] || hardcoded;
      },

      getFieldErrors: function (f) {
        if (!this.isFieldVisible(f.name)) return null;
        var val = this.data[f.name];
        if (this.isFieldRequired(f.name)) {
          var empty = f.type === 'file'
            ? !(this.files && this.files[f.name] && this.files[f.name].length)
            : val === '' || val === null || val === undefined || val === false || (Array.isArray(val) && val.length === 0);
          var defMsg = f.type === 'checkbox' ? "Підтвердіть згоду" : f.type === 'checkbox_group' ? "Оберіть хоча б один варіант" : f.type === 'file' ? "Виберіть хоча б один файл" : "Це поле обов'язкове";
          if (empty) return this.getValidationMsg(f, 'required', 'required', defMsg);
        }
        if (val === '' || val === null || val === undefined) {
          if (f.type !== 'file') return null;
        }
        if (f.type === 'number') {
          var num = parseFloat(val);
          if (!isNaN(num)) {
            if (f.min !== undefined && num < f.min) return this.getValidationMsg(f, 'min', 'min', 'Мінімальне значення: ' + f.min);
            if (f.max !== undefined && num > f.max) return this.getValidationMsg(f, 'max', 'max', 'Максимальне значення: ' + f.max);
          }
        }
        var textTypes = ['text', 'email', 'tel', 'textarea', 'number'];
        if (f.type === 'file') {
          var fl = this.files[f.name] || [];
          var fv = this.fileValid && this.fileValid[f.name] || [];
          var cfg = f.file || {};
          var mf = cfg.maxFiles || 10;
          var mn = cfg.minFiles || 0;
          if (fl.length > mf) return 'Максимум ' + mf + ' файлів';
          if (mn && fl.length < mn) {
            var mnp = this.pluralizeFile ? this.pluralizeFile(mn) : 'файлів';
            return 'Мінімум ' + mn + ' ' + mnp;
          }
          for (var fi = 0; fi < fl.length; fi++) {
            if (fv[fi] === false) {
              var si = this.parseFileSize ? this.parseFileSize(cfg.maxSize) : null;
              if (si) return 'Файл "' + fl[fi].name + '" перевищує ' + si.display;
            }
          }
        }
        if (textTypes.indexOf(f.type) !== -1 && typeof val === 'string') {
          var pattern = f.pattern || (f.type !== 'email' && this.config.settings && this.config.settings.pattern);
          if (pattern) {
            try {
              if (!new RegExp(pattern).test(val)) {
                var pmsg = (f.validation && f.validation.pattern) || (this.config.settings && this.config.settings.feedback && this.config.settings.feedback.pattern) || 'Неправильний формат';
                return pmsg;
              }
            } catch (e) {}
          }
        }
        if (textTypes.indexOf(f.type) !== -1 && typeof val === 'string') {
          var len = val.length;
          if (f.minlength !== undefined && len < f.minlength) {
            return this.getValidationMsg(f, 'minlength', 'minlength', 'Мінімальна довжина: ' + f.minlength + ' символів');
          }
          if (f.maxlength !== undefined && len > f.maxlength) {
            return this.getValidationMsg(f, 'maxlength', 'maxlength', 'Максимальна довжина: ' + f.maxlength + ' символів');
          }
        }
        if (f.type === 'email' && typeof val === 'string') {
          var atIdx = val.indexOf('@');
          if (atIdx === -1 || atIdx === val.length - 1 || atIdx === 0) {
            var emsg = (f.validation && f.validation.email) || (this.config.settings && this.config.settings.feedback && this.config.settings.feedback.email) || 'Введіть дійсну електронну адресу';
            return emsg;
          }
        }
        if (f.validation && f.validation.compare && Array.isArray(f.validation.compare)) {
          for (var r = 0; r < f.validation.compare.length; r++) {
            var rule = f.validation.compare[r];
            var otNum;
            if (Array.isArray(rule.field)) {
              var sum = 0;
              var hasAny = false;
              for (var k = 0; k < rule.field.length; k++) {
                var fieldName = rule.field[k];
                var v = this.data[fieldName];
                if (v === '' || v === null || v === undefined) continue;
                var n = parseFloat(v);
                if (!isNaN(n)) { sum += n; hasAny = true; }
              }
              if (!hasAny) continue;
              otNum = sum;
            } else {
              var otherVal = this.data[rule.field];
              if (val === '' || val === null || val === undefined ||
                  otherVal === '' || otherVal === null || otherVal === undefined) continue;
              otNum = parseFloat(otherVal);
            }
            if (val === '' || val === null || val === undefined) continue;
            var myNum = parseFloat(val);
            if (isNaN(myNum)) continue;
            if (!Array.isArray(rule.field) && isNaN(otNum)) continue;
            var pass = false;
            switch (rule.operator) {
              case '<':  pass = myNum < otNum; break;
              case '<=': pass = myNum <= otNum; break;
              case '>':  pass = myNum > otNum; break;
              case '>=': pass = myNum >= otNum; break;
              case '==': pass = myNum == otNum; break;
              case '!=': pass = myNum != otNum; break;
            }
            if (!pass) {
              var cmsg = rule.message || (f.validation && f.validation.compareMessage) || (this.config.settings && this.config.settings.feedback && this.config.settings.feedback.compare) || 'Некоректне значення';
              return cmsg;
            }
          }
        }
        return null;
      },

      fieldCol: function (fieldName) {
        var f = this.getField(fieldName);
        return f ? (f.col || 'col-12') : 'col-12';
      },

      autoCol: function (fieldName) {
        var info = fieldRowMap[fieldName];
        if (!info || !info.auto) return 'col-12';

        var bps = ['xs', 'sm', 'md', 'lg', 'xl'];
        var visibleNames = [];
        for (var i = 0; i < info.siblings.length; i++) {
          if (this.isFieldVisible(info.siblings[i])) {
            visibleNames.push(info.siblings[i]);
          }
        }
        if (visibleNames.length <= 1) return 'col-12';

        // If field has explicit col, return it as-is
        var me = this.getField(fieldName);
        if (me && me.col) return me.col;

        // Collect raw bps from fixed siblings to determine active breakpoints
        var rawBpsSet = {};
        var fixedRaws = [];
        var fixedSiblingCount = 0;
        for (var i = 0; i < visibleNames.length; i++) {
          var f = this.getField(visibleNames[i]);
          if (f && f.col) {
            var raw = parseGridClasses(f.col);
            fixedRaws.push(raw);
            for (var k in raw) {
              if (raw.hasOwnProperty(k)) rawBpsSet[k] = true;
            }
            fixedSiblingCount++;
          }
        }

        // Build active bps list: [xs, ...sorted(raw bps)]
        var activeBps = ['xs'];
        var bpOrder = { sm: 1, md: 2, lg: 3, xl: 4 };
        var sorted = [];
        for (var k in rawBpsSet) {
          if (rawBpsSet.hasOwnProperty(k) && k !== 'xs') sorted.push(k);
        }
        sorted.sort(function (a, b) { return bpOrder[a] - bpOrder[b]; });
        for (var i = 0; i < sorted.length; i++) activeBps.push(sorted[i]);

        // Build cascaded grids for fixed siblings
        var fixedCascades = [];
        for (var i = 0; i < fixedRaws.length; i++) {
          var raw = fixedRaws[i];
          var casc = {};
          var prev;
          for (var b = 0; b < bps.length; b++) {
            if (raw[bps[b]] !== undefined) prev = raw[bps[b]];
            if (prev !== undefined) casc[bps[b]] = prev;
          }
          fixedCascades.push(casc);
        }

        var autoCount = visibleNames.length - fixedSiblingCount;

        // Calculate width for each active breakpoint
        var result = {};
        for (var a = 0; a < activeBps.length; a++) {
          var bp = activeBps[a];
          var fixed = 0;
          var anyFixedAtBp = false;

          for (var i = 0; i < fixedCascades.length; i++) {
            var w = fixedCascades[i][bp];
            if (w !== undefined) {
              fixed += w;
              anyFixedAtBp = true;
            }
          }

          if (!anyFixedAtBp) {
            if (fixedSiblingCount === 0) {
              result[bp] = Math.floor(12 / autoCount);
            } else {
              result[bp] = 12;
            }
          } else {
            var remaining = 12 - fixed;
            if (remaining < autoCount) {
              result[bp] = 12;
            } else {
              result[bp] = Math.floor(remaining / autoCount);
            }
          }
        }

        // Handle uneven distribution for active bps !== xs
        for (var a = 1; a < activeBps.length; a++) {
          var bp = activeBps[a];
          var fixed = 0;
          for (var i = 0; i < fixedCascades.length; i++) {
            var w = fixedCascades[i][bp];
            if (w !== undefined) fixed += w;
          }

          var remaining = 12 - fixed;
          if (remaining > 0 && remaining < autoCount) {
            result[bp] = 12;
          } else if (remaining >= autoCount) {
            var base = Math.floor(remaining / autoCount);
            var extra = remaining - base * autoCount;
            var autoIdx = 0;
            for (var i = 0; i < visibleNames.length; i++) {
              var f = this.getField(visibleNames[i]);
              if (f && f.col) continue;
              if (visibleNames[i] === fieldName) break;
              autoIdx++;
            }
            result[bp] = base + (autoIdx < extra ? 1 : 0);
          }
        }

        // Build classes from active breakpoints
        var classes = [];
        for (var a = 0; a < activeBps.length; a++) {
          var bp = activeBps[a];
          var w = result[bp];
          if (w === undefined) continue;
          if (bp === 'xs') {
            classes.push('col-' + w);
          } else {
            classes.push('col-' + bp + '-' + w);
          }
        }
        return classes.join(' ');
      },

      labelText: function (name) {
        var f = this.getField(name);
        if (!f || !f.label) return '';
        var l = f.label;
        if (l.depends) {
          for (var i = 0; i < l.depends.length; i++) {
            var d = l.depends[i];
            if (matchesValues(this.data[d.field], d.values, d.except)) return d.text;
          }
        }
        return (typeof l === 'string') ? l : (l.text || '');
      },

      evaluateDepends: function (deps) {
        if (!deps || deps.length === 0) return true;
        var self = this;
        function checkWhen(w) {
          if (!w) return true;
          var dataVal = self.data[w.field];
          if (w.values && w.values.length > 0) return w.values.indexOf(dataVal) !== -1;
          if (w.value !== undefined) return matchesValueCondition(dataVal, w.value);
          return true;
        }
        function checkOne(d) {
          if (!checkWhen(d.when)) return true;
          if (!matchesValues(self.data[d.field], d.values, d.except)) return false;
          if (d.value !== undefined && !matchesValueCondition(self.data[d.field], d.value)) return false;
          return true;
        }
        var mode = 'and';
        for (var d = 0; d < deps.length; d++) {
          if (deps[d].logic === 'or') { mode = 'or'; break; }
        }
        if (mode === 'or') {
          for (var d = 0; d < deps.length; d++) {
            if (checkOne(deps[d])) return true;
          }
          return false;
        }
        for (var d = 0; d < deps.length; d++) {
          if (!checkOne(deps[d])) return false;
        }
        return true;
      },

      isFieldVisible: function (name) {
        var f = this.getField(name);
        return f ? this.evaluateDepends(f.depends) : true;
      },

      isFieldRequired: function (name) {
        var f = this.getField(name);
        if (!f) return false;
        var r = f.required;
        if (r === true) return true;
        if (Array.isArray(r)) return this.evaluateDepends(r);
        if (r && typeof r === 'object' && !Array.isArray(r) && r.depends) return this.evaluateDepends(r.depends);
        return false;
      },

      requiredMeta: function (name, key, def) {
        def = def || '';
        var f = this.getField(name);
        if (!f) return def;
        var r = f.required;
        if (r && typeof r === 'object' && !Array.isArray(r) && r[key] !== undefined) return r[key];
        var settings = this.config && this.config.settings && this.config.settings.required;
        return (settings && settings[key] !== undefined) ? settings[key] : def;
      },

      evaluateSet: function (name) {
        var f = this.getField(name);
        if (!f || !f.value || !f.value.depends) return null;
        for (var i = 0; i < f.value.depends.length; i++) {
          var rule = f.value.depends[i];
          if (matchesValues(this.data[rule.field], rule.values, rule.except))
            return { value: rule.value, readonly: !!rule.readonly, matched: true };
        }
        var def = f.value.default || {};
        return { value: def.value !== undefined ? def.value : '',
                 readonly: def.readonly !== undefined ? def.readonly : false,
                 matched: false };
      },

      isFieldReadonly: function (name) {
        var result = this.evaluateSet(name);
        return result ? result.readonly : false;
      },

      clearField: function (name) {
        this.data[name] = '';
        this.touched[name] = false;
        if (this.errors[name]) {
          delete this.errors[name];
          this.errors = Object.assign({}, this.errors);
        }
        if (dnsTimers[name]) { clearTimeout(dnsTimers[name]); delete dnsTimers[name]; }
      },

      applySetRules: function () {
        for (var i = 0; i < fieldsCache.length; i++) {
          var f = fieldsCache[i];
          if (!f.value || !f.value.depends) continue;
          var result = this.evaluateSet(f.name);
          if (!result) continue;
          if (result.matched) {
            if (this.data[f.name] !== result.value) {
              this.data[f.name] = result.value;
            }
          } else {
            var cur = this.data[f.name];
            if (cur === '' || cur === undefined || cur === null) {
              if (cur !== result.value) {
                this.data[f.name] = result.value;
              }
            }
          }
        }
      },

      nextStep: function () { if (this.validateStep(this.step)) { this.step++; var el = document.querySelector('.step-indicator'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },

      prevStep: function () { if (this.step > 1) { this.step--; var el = document.querySelector('.step-indicator'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },

      validateStep: function (n) {
        var idx = n - 1;
        if (idx < 0 || idx >= steps.length) return true;
        var fields = getStepFields(steps[idx]);
        var errors = {};
        var valid = true;
        for (var i = 0; i < fields.length; i++) {
          var err = this.getFieldErrors(fields[i]);
          if (err !== null) { errors[fields[i].name] = err; valid = false; }
        }
        this.errors = errors;
        if (!valid) {
          this.$nextTick(function () {
            var el = document.querySelector('.is-invalid');
            if (el) { el.focus(); if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          });
        }
        return valid;
      },

      validateAll: function () {
        var errors = {};
        var firstErrorStep = -1;
        for (var s = 0; s < steps.length; s++) {
          var fields = getStepFields(steps[s]);
          var stepHasError = false;
          for (var i = 0; i < fields.length; i++) {
            var err = this.getFieldErrors(fields[i]);
            if (err !== null) { errors[fields[i].name] = err; stepHasError = true; }
          }
          if (stepHasError && firstErrorStep === -1) firstErrorStep = s + 1;
        }
        this.errors = errors;
        if (Object.keys(errors).length > 0) {
          if (firstErrorStep > 0) this.step = firstErrorStep;
          this.$nextTick(function () {
            var el = document.querySelector('.is-invalid');
            if (el) { el.focus(); if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          });
          return false;
        }
        return true;
      }
    };

    Object.defineProperty(base, 'stepValid', {
      get: function () {
        var idx = this.step - 1;
        if (idx < 0 || idx >= steps.length) return true;
        var fields = getStepFields(steps[idx]);
        for (var i = 0; i < fields.length; i++) {
          var f = fields[i];
          if (!this.isFieldVisible(f.name)) continue;
          if (this.getFieldErrors(f) !== null) return false;
        }
        return true;
      },
      enumerable: true
    });

    return base;
  }

  window.FormEngine = {
    getStepFields: getStepFields,
    hasWidget: hasWidget,
    getField: getField,
    createBase: createBase,

    mixInto: function (target, config) {
      var base = createBase(config);
      var descs = Object.getOwnPropertyDescriptors(base);
      for (var key in descs) {
        Object.defineProperty(target, key, descs[key]);
      }
      return target;
    }
  };
})();

(function () {
  'use strict';

  var triggers = {};
  var ModalApi = window.jQuery && jQuery.fn && jQuery.fn.modal && jQuery.fn.modal.Constructor;
  var patched = false;

  function isInModal(el) {
    return !!(el && el.closest && el.closest('.modal'));
  }

  function getTrigger(modal) {
    if (!modal || !modal.id) return null;
    return document.querySelector('[data-target="#' + modal.id + '"]');
  }

  function blurInside(modal) {
    var active = document.activeElement;
    if (modal && isInModal(active) && modal.contains(active)) {
      active.blur();
    }
  }

  function releaseModalFocusTrap() {
    if (window.jQuery && jQuery.fn && jQuery.fn.off) {
      jQuery(document).off('focusin.bs.modal');
    }
  }

  // Patch Bootstrap 4 Modal._hideModal so focus leaves the modal BEFORE
  // aria-hidden="true" is applied. Without this, any close path (close
  // button click, ESC, backdrop, programmatic hide) leaves focus on an
  // element inside the aria-hidden modal, and Chrome logs
  // "Blocked aria-hidden ... retained focus".
  (function patchHideModal() {
    if (!ModalApi || !ModalApi.prototype || !ModalApi.prototype._hideModal) return;
    if (patched) return;
    patched = true;
    var orig = ModalApi.prototype._hideModal;
    ModalApi.prototype._hideModal = function () {
      blurInside(this._element);
      var trg = getTrigger(this._element);
      if (trg && trg.focus) trg.focus();
      return orig.apply(this, arguments);
    };
  })();

  document.addEventListener('show.bs.modal', function (e) {
    var id = e.target && e.target.id;
    var el = e.relatedTarget || document.activeElement;
    if (id && el && !isInModal(el)) triggers[id] = el;
  });

  document.addEventListener('hide.bs.modal', function (e) {
    var id = e.target && e.target.id;
    releaseModalFocusTrap();
    blurInside(e.target);
    var el = triggers[id] || getTrigger(e.target);
    if (el && el.focus) el.focus();
    triggers[id] = null;
  });

  document.addEventListener('hidden.bs.modal', function (e) {
    var id = e.target && e.target.id;
    var el = triggers[id] || getTrigger(e.target);
    if (el && el.focus) el.focus();
    delete triggers[id];
  });
})();
