(function () {
  'use strict';

  var configEl = document.getElementById('add-property-config');
  if (!configEl) return;

  var formConfig;
  try { formConfig = JSON.parse(configEl.textContent); } catch (e) { return; }

  var currencyRates = formConfig.rates || { usd: 43.50, eur: 51.50, nbu: 43.2413 };

  var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  function initTurnstile() {
    if (isLocal) {
      var notice = document.getElementById('local-notice');
      if (notice) notice.style.display = 'block';
      return;
    }
    var widget = document.getElementById('turnstile-widget');
    if (!widget || widget.hasChildNodes()) return;
    if (typeof turnstile !== 'undefined') {
      turnstile.render('#turnstile-widget', { sitekey: '0x4AAAAAADf6HF6IRoXXsCUb' });
    }
  }

  function tryInitTurnstile() {
    initTurnstile();
    if (isLocal) return;
    if (!document.getElementById('turnstile-widget') || !document.getElementById('turnstile-widget').hasChildNodes()) {
      setTimeout(tryInitTurnstile, 300);
    }
  }

  document.addEventListener('alpine:init', function () {
    Alpine.data('formApp', function () {
      return {
        step: 1,
        totalSteps: formConfig.steps ? formConfig.steps.length : 3,
        config: formConfig,

        data: {
          type: 'sell',
          property_type: '',
          rooms: '',
          surface: '',
          surface_land: '',
          floors: '',
          floor: '',
          parking: '',
          price: '',
          currency: 'USD',
          location: '',
          region: '',
          address: '',
          seller: '',
          phone: '',
          description: '',
          agree: false
        },

        errors: {},
        touched: {},
        files: [],
        submitting: false,
        submitted: false,
        turnstileToken: '',

        init: function () {
          var self = this;
          var steps = this.config.steps || [];
          for (var s = 0; s < steps.length; s++) {
            var fields = steps[s].fields || [];
            for (var f = 0; f < fields.length; f++) {
              self.touched[fields[f].name] = false;
            }
          }
          this.$watch('step', function () {
            this.errors = {};
          });
        },

        validateField: function (fieldName) {
          var steps = this.config.steps || [];
          var field;
          for (var s = 0; s < steps.length; s++) {
            var fields = steps[s].fields || [];
            for (var f = 0; f < fields.length; f++) {
              if (fields[f].name === fieldName) { field = fields[f]; break; }
            }
            if (field) break;
          }
          if (!field) return;
          this.touched[fieldName] = true;
          var err = this.getFieldErrors(field);
          if (err !== null) {
            if (this.errors[fieldName] !== err) {
              this.errors[fieldName] = err;
              this.errors = Object.assign({}, this.errors);
            }
          } else {
            if (this.errors[fieldName]) {
              delete this.errors[fieldName];
              this.errors = Object.assign({}, this.errors);
            }
          }
          this.clearHiddenErrors();
        },

        fieldClass: function (name) {
          if (this.errors[name]) return 'is-invalid';
          if (this.touched[name]) return 'is-valid';
          return '';
        },

        clearHiddenErrors: function () {
          var steps = this.config.steps || [];
          var changed = false;
          for (var s = 0; s < steps.length; s++) {
            var fields = steps[s].fields || [];
            for (var f = 0; f < fields.length; f++) {
              var name = fields[f].name;
              if (!this.isFieldVisible(name)) {
                if (this.errors[name]) { delete this.errors[name]; changed = true; }
                if (this.touched[name]) { this.touched[name] = false; changed = true; }
              }
            }
          }
          if (changed) this.errors = Object.assign({}, this.errors);
        },

        getFieldErrors: function (f) {
          if (!this.isFieldVisible(f.name)) return null;
          var val = this.data[f.name];

          if (f.required) {
            var empty = val === '' || val === null || val === undefined || val === false;
            if (empty) return f.type === 'checkbox' ? "Підтвердіть згоду" : "Це поле обов'язкове";
          }

          if (val === '' || val === null || val === undefined) return null;

          if (f.type === 'number') {
            var num = parseFloat(val);
            if (!isNaN(num)) {
              if (f.min !== undefined && num < f.min) return 'Мінімальне значення: ' + f.min;
              if (f.max !== undefined && num > f.max) return 'Максимальне значення: ' + f.max;
            }
          }

          if (f.pattern) {
            try {
              if (!new RegExp(f.pattern).test(val)) return 'Неправильний формат';
            } catch (e) {}
          }

          return null;
        },

        handleFileChange: function (event) {
          var files = Array.prototype.slice.call(event.target.files);
          this.files = files;
          if (files.length > 10) {
            this.errors['images'] = 'Максимум 10 файлів';
            return;
          }
          for (var i = 0; i < files.length; i++) {
            if (files[i].size > 5 * 1024 * 1024) {
              this.errors['images'] = 'Файл "' + files[i].name + '" перевищує 5 MB';
              return;
            }
          }
          delete this.errors['images'];
        },

        get pricePerSqmt() {
          var p = parseFloat(this.data.price);
          var s = parseFloat(this.data.surface);
          if (p && s) return (p / s).toFixed(2);
          return '';
        },

        get priceUah() {
          var p = parseFloat(this.data.price);
          if (!p) return '';
          var rates = { USD: currencyRates.usd, EUR: currencyRates.eur, UAH: 1 };
          var rate = rates[this.data.currency] || 1;
          return Math.round(p * rate).toLocaleString('uk-UA');
        },

        isFieldVisible: function (name) {
          var steps = this.config.steps || [];
          for (var s = 0; s < steps.length; s++) {
            var fields = steps[s].fields || [];
            for (var f = 0; f < fields.length; f++) {
              if (fields[f].name !== name) continue;
              var deps = fields[f].depends || [];
              for (var d = 0; d < deps.length; d++) {
                var dep = deps[d];
                var val = this.data[dep.field];
                if (dep.values.indexOf(val) === -1) return false;
              }
              return true;
            }
          }
          return true;
        },

        nextStep: function () {
          if (this.validateStep(this.step)) {
            this.step++;
          }
        },

        prevStep: function () {
          if (this.step > 1) this.step--;
        },

        validateStep: function (n) {
          var steps = this.config.steps || [];
          var idx = n - 1;
          if (idx < 0 || idx >= steps.length) return true;
          var fields = steps[idx].fields || [];
          var errors = {};
          var valid = true;

          for (var i = 0; i < fields.length; i++) {
            var err = this.getFieldErrors(fields[i]);
            if (err !== null) {
              errors[fields[i].name] = err;
              valid = false;
            }
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
          var steps = this.config.steps || [];
          var errors = {};
          var firstErrorStep = -1;

          for (var s = 0; s < steps.length; s++) {
            var fields = steps[s].fields || [];
            var stepHasError = false;

            for (var i = 0; i < fields.length; i++) {
              var err = this.getFieldErrors(fields[i]);
              if (err !== null) {
                errors[fields[i].name] = err;
                stepHasError = true;
              }
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
        },

        submit: function () {
          if (!this.validateAll()) return;
          this.submitting = true;

          var formEl = document.getElementById('add-property-form');
          var turnstileField = formEl ? formEl.querySelector('[name="cf-turnstile-response"]') : null;
          var turnstileToken = turnstileField ? turnstileField.value : '';

          var payload = { data: this.data };

          var formData = new FormData();
          formData.append('data', JSON.stringify(this.data));
          formData.append('cf-turnstile-response', turnstileToken);

          fetch('/php/add-property.php', {
            method: 'POST',
            body: formData
          })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.success) {
              this.submitted = true;
              this.submitting = false;
            } else {
              this.submitting = false;
              if (res.errors) this.errors = res.errors;
            }
          }.bind(this))
          .catch(function () {
            this.submitting = false;
          }.bind(this));
        }
      };
    });
  });

  tryInitTurnstile();
})();
