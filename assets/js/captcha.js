(function () {
  'use strict';

  var config = window.TURNSTILE_CONFIG || {};

  var DEFAULTS = {
    enabled: false,
    sitekey: '',
    language: 'uk-ua',
    retryInterval: 8000,
    maxRetries: 3,
    localHosts: ['localhost', '127.0.0.1', '0.0.0.0', '::1']
  };

  function cfg(key) {
    if (config[key] === undefined || config[key] === null || config[key] === '') return DEFAULTS[key];
    return config[key];
  }

  function hostList() {
    var list = cfg('localHosts');
    if (Array.isArray(list)) return list;
    return String(list).split(',').map(function (h) { return h.trim(); }).filter(Boolean);
  }

  // Captcha працює лише в online-середовищі. Якщо вона вимкнена на етапі
  // збірки (_config.yml turnstile_enabled: false), форми пропускають її
  // і показують локальний notice замість Turnstile.
  function isLocal() {
    if (cfg('enabled') !== true) return true;
    var host = window.location.hostname;
    if (hostList().indexOf(host) !== -1) return true;
    return /\.local$|\.test$|\.localhost$/.test(host);
  }

  function enabled() {
    return cfg('enabled') === true && !isLocal();
  }

  function tokenOf(target) {
    var container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) return '';
    var field = container.querySelector('[name="cf-turnstile-response"]');
    return field && field.value ? field.value : '';
  }

  var instances = {};

  function clearTimer(state) {
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
  }

  function clearPoll(state) {
    if (state.poll) {
      clearTimeout(state.poll);
      state.poll = null;
    }
  }

  function fail(state, message) {
    clearPoll(state);
    if (state.attempts >= cfg('maxRetries')) {
      state.dead = true;
      if (typeof state.onError === 'function') state.onError(message);
    }
  }

  function retry(state) {
    clearPoll(state);
    if (state.dead || state.attempts >= cfg('maxRetries')) {
      fail(state, 'error');
      return;
    }
    state.timer = setTimeout(function () {
      state.timer = null;
      if (!state.rendered || typeof window.turnstile === 'undefined') {
        poll(state);
        return;
      }
      try {
        window.turnstile.reset(state.selector);
        state.attempts++;
      } catch (err) {
        poll(state);
      }
    }, cfg('retryInterval'));
  }

  function renderNow(state, action) {
    if (!state.container || !state.container.isConnected) return;
    state.selector = '#' + state.container.id;

    var options = {
      sitekey: cfg('sitekey'),
      language: cfg('language'),
      retry: 'auto',
      'retry-interval': cfg('retryInterval'),
      callback: function () {
        clearTimer(state);
        clearPoll(state);
        state.solved = true;
      },
      'error-callback': function (code) {
        state.errorCode = code;
        retry(state);
      },
      'timeout-callback': function () {
        retry(state);
      },
      'expired-callback': function () {
        state.solved = false;
        retry(state);
      }
    };
    if (action) options.action = action;

    state.rendered = true;
    try {
      window.turnstile.render(state.selector, options);
    } catch (err) {
      state.rendered = false;
      poll(state);
    }
  }

  function poll(state, action) {
    if (state.dead || state.rendered) return;
    if (typeof window.turnstile === 'undefined') {
      state.poll = setTimeout(function () {
        state.poll = null;
        poll(state, action);
      }, 200);
      return;
    }
    if (state.container.querySelector('.cf-turnstile, iframe, input[name="cf-turnstile-response"]')) return;
    renderNow(state, action);
  }

  function mount(selector, action, onError) {
    var container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!container) return null;

    var existing = container.id && instances[container.id];
    if (existing) {
      if (existing.dead && !isLocal()) {
        existing.dead = false;
        existing.solved = false;
        existing.attempts = 0;
        existing.onError = onError;
        clearTimer(existing);
        clearPoll(existing);
        if (existing.rendered && typeof window.turnstile !== 'undefined') {
          try {
            window.turnstile.remove(existing.selector);
          } catch (err) {
            /* widget already gone */
          }
        }
        existing.rendered = false;
        if (existing.container) existing.container.innerHTML = '';
        poll(existing, action || existing.action);
      }
      return existing;
    }

    var state = {
      container: container,
      selector: selector,
      action: action || '',
      onError: onError,
      attempts: 0,
      rendered: false,
      solved: false,
      dead: false,
      timer: null,
      poll: null,
      errorCode: null
    };

    if (container.id) instances[container.id] = state;

    if (isLocal()) {
      state.dead = true;
      state.solved = true;
      return state;
    }

    poll(state, action);
    return state;
  }

  function unmount(selector) {
    var container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    var state = container && container.id ? instances[container.id] : null;
    if (!state) return;
    clearTimer(state);
    clearPoll(state);
    if (state.rendered && typeof window.turnstile !== 'undefined') {
      try {
        window.turnstile.remove(state.selector);
      } catch (err) {
        /* widget already gone */
      }
    }
    if (container && container.id) delete instances[container.id];
  }

  function solved(selector) {
    var container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (isLocal()) return true;
    if (!container) return false;
    return tokenOf(container) !== '';
  }

  window.CaptchaSite = {
    enabled: enabled,
    isLocal: isLocal,
    mount: mount,
    unmount: unmount,
    solved: solved,
    token: tokenOf,
    selectorOf: function (selector) {
      var container = typeof selector === 'string' ? document.querySelector(selector) : selector;
      return container && container.id ? '#' + container.id : selector;
    }
  };

  if (!enabled()) return;

  // api.js підключено як async defer, тому сценарій може виконатися раніше.
  window.addEventListener('load', function () {
    Object.keys(instances).forEach(function (id) {
      var state = instances[id];
      if (!state || state.rendered || state.dead) return;
      poll(state, state.action);
    });
  });
})();