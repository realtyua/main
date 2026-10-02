(function () {
  var form = document.getElementById('notify-form');
  if (!form) return;

  var tsField = document.getElementById('notify-timestamp');
  if (tsField) tsField.value = Date.now();

  var reason = document.getElementById('notify-reason');
  var details = document.getElementById('notify-details');
  var counter = document.getElementById('notify-counter');
  var contactName = document.getElementById('notify-name');
  var contactPhone = document.getElementById('notify-phone');
  var contactEmail = document.getElementById('notify-email');

  if (details && counter) {
    details.addEventListener('input', function () {
      counter.textContent = Math.max(0, 256 - details.value.length);
    });
  }

  var ukrPattern = /^[а-яА-ЯіїєґІЇЄҐ0-9\s\-–—,\.!?\(\)«»@_#\+:;'"]*$/;
  var phonePattern = /^[\+\d\s\-\(\)]*$/;
  var emailPattern = /^[a-zA-Z0-9\w\.@\-_]*$/;

  function validateUkr(field) {
    var val = field.value;
    if (!val) {
      field.setCustomValidity('');
      field.classList.remove('is-valid', 'is-invalid');
    } else if (!ukrPattern.test(val)) {
      field.setCustomValidity('invalid');
      field.classList.remove('is-valid');
      field.classList.add('is-invalid');
    } else {
      field.setCustomValidity('');
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
    }
  }

  function validateReason() {
    if (reason.value) {
      reason.classList.remove('is-invalid');
      reason.classList.add('is-valid');
    } else {
      reason.classList.remove('is-valid');
      reason.classList.add('is-invalid');
    }
  }

  if (reason) {
    reason.addEventListener('change', validateReason);
  }

  function validateSimple(field, pattern) {
    var val = field.value;
    if (!val) {
      field.setCustomValidity('');
      field.classList.remove('is-valid', 'is-invalid');
    } else if (!pattern.test(val)) {
      field.setCustomValidity('invalid');
      field.classList.remove('is-valid');
      field.classList.add('is-invalid');
    } else {
      field.setCustomValidity('');
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
    }
  }

  if (details) {
    details.addEventListener('input', function () { validateUkr(details); });
  }
  if (contactName) {
    contactName.addEventListener('input', function () { validateUkr(contactName); });
  }
  if (contactPhone) {
    contactPhone.addEventListener('input', function () { validateSimple(contactPhone, phonePattern); });
  }
  if (contactEmail) {
    contactEmail.addEventListener('input', function () { validateSimple(contactEmail, emailPattern); });
  }

  var Captcha = window.CaptchaSite || null;

  function notifyError(message) {
    var err = document.getElementById('notify-error');
    if (!err) return;
    if (message) err.textContent = message;
    err.classList.remove('d-none');
  }

  // map the worker's machine code to a specific Ukrainian message,
  // falling back to the generic one already in the markup
  var NOTIFY_ERROR_TEXTS = {
    E_CAPTCHA: 'Не вдалося перевірити, що ви не робот. Оновіть сторінку та спробуйте ще раз.',
    E_CAPTCHA_REQUIRED: 'Підтвердьте, що ви не робот, щоб надіслати звернення.',
    E_CAPTCHA_INVALID: 'Перевірка captcha застаріла або була вже використана. Оновіть сторінку та спробуйте ще раз.',
    E_CAPTCHA_ACTION: 'Перевірка captcha не пройдена. Оновіть сторінку та спробуйте ще раз.',
    E_CAPTCHA_HOSTNAME: 'Перевірка captcha не підтримує цей домен. Спробуйте з головної сторінки сайту.',
    E_CAPTCHA_UNAVAILABLE: 'Сервер тимчасово недоступний. Спробуйте ще раз пізніше.',
    E_SPAM: 'Запит відхилено. Спробуйте ще раз.',
    E_INVALID_PAYLOAD: 'Не вдалося обробити дані форми. Спробуйте ще раз.',
    E_MAIL_UNAVAILABLE: 'Сервер тимчасово недоступний. Спробуйте ще раз пізніше.',
    E_RATE_LIMIT_EXCEEDED: 'Забагато спроб за короткий час. Зачекайте хвилину і спробуйте ще раз.',
    E_DAILY_LIMIT_EXCEEDED: 'Забагато спроб за короткий час. Зачекайте хвилину і спробуйте ще раз.'
  };

  function notifyErrorText(code) {
    return NOTIFY_ERROR_TEXTS[code] || '';
  }

  function resetNotifyForm() {
    var ts = document.getElementById('notify-timestamp');
    if (ts) ts.value = Date.now();
    var err = document.getElementById('notify-error');
    if (err) err.classList.add('d-none');
  }

  function mountNotifyCaptcha() {
    if (!Captcha) return;
    if (Captcha.isLocal()) {
      var notice = document.getElementById('notify-local-notice');
      if (notice) notice.classList.remove('d-none');
      return;
    }
    var localNotice = document.getElementById('notify-local-notice');
    if (localNotice) localNotice.classList.add('d-none');
    var retryNotice = document.getElementById('notify-captcha-retry');
    if (retryNotice) retryNotice.classList.add('d-none');
    Captcha.mount('#turnstile-widget', 'notify_property', function () {
      notifyError('Не вдалося завантажити перевірку.');
      if (retryNotice) retryNotice.classList.remove('d-none');
    });
  }

  // Bootstrap 4 викликає події модалки через jQuery.trigger(), який не
  // породжує нативну DOM-подію. Тому слухач через addEventListener ніколи не
  // спрацьовує. При наявності jQuery підписка робиться через .on(), інакше
  // залишається нативний варіант.
  function onModalEvent(el, eventName, handler) {
    if (window.jQuery) {
      window.jQuery(el).on(eventName, handler);
      return;
    }
    el.addEventListener(eventName, handler);
  }

  var modalEl = document.getElementById('notifyModal');
  if (modalEl) {
    onModalEvent(modalEl, 'show.bs.modal', resetNotifyForm);

    // Turnstile не малюється у контейнері з display:none, а Bootstrap 4
    // надсилає show.bs.modal до _showElement(). Тому captcha встановлюється
    // на shown.bs.modal, коли модалка вже видима.
    onModalEvent(modalEl, 'shown.bs.modal', mountNotifyCaptcha);

    var captchaRetry = document.getElementById('notify-captcha-retry-btn');
    if (captchaRetry) {
      captchaRetry.addEventListener('click', mountNotifyCaptcha);
    }
    onModalEvent(modalEl, 'hidden.bs.modal', function () {
      if (Captcha) Captcha.unmount('#turnstile-widget');
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (reason) validateReason();
    [details, contactName, contactPhone, contactEmail].forEach(function (el) {
      if (!el) return;
      if (el === contactPhone) validateSimple(el, phonePattern);
      else if (el === contactEmail) validateSimple(el, emailPattern);
      else validateUkr(el);
    });

    if (Captcha && Captcha.enabled() && !Captcha.solved('#turnstile-widget')) {
      notifyError('Підтвердьте, що ви не робот, щоб надіслати звернення.');
      return;
    }

    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    form.classList.remove('was-validated');

    var formData = new FormData(form);
    var data = {};
    for (var pair of formData.entries()) {
      data[pair[0]] = pair[1];
    }
    data['cf-turnstile-response'] = Captcha ? Captcha.token('#turnstile-widget') : '';

    var submitBtn = document.getElementById('notify-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Надсилаю<span class="spinner-border spinner-border-sm ml-2" role="status"><span class="sr-only">Надсилаю...</span></span>';

    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(function (response) {
      return response.json()
        .catch(function () { return {}; })
        .then(function (body) {
          if (!response.ok || !body || !body.success) {
            notifyError(notifyErrorText(body && body.code));
            throw new Error('Send failed');
          }
          return body;
        });
    })
    .then(function () {
      var groups = form.querySelectorAll('.form-group');
      for (var i = 0; i < groups.length; i++) {
        groups[i].classList.add('d-none');
      }
      var localNotice = document.getElementById('notify-local-notice');
      if (localNotice) localNotice.classList.add('d-none');
      form.querySelector('#notify-success').classList.remove('d-none');
      submitBtn.classList.add('d-none');
    })
    .catch(function () {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Надіслати';
      form.querySelector('#notify-error').classList.remove('d-none');
    });
  });
})();