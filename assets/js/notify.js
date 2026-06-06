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

    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    form.classList.remove('was-validated');

    var submitBtn = document.getElementById('notify-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Надсилаю<span class="spinner-border spinner-border-sm ml-2" role="status"><span class="sr-only">Надсилаю...</span></span>';

    var formData = new FormData(form);
    var data = {};
    for (var pair of formData.entries()) {
      data[pair[0]] = pair[1];
    }

    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(function (response) {
      if (!response.ok) throw new Error('Server error');
      return response.json();
    })
    .then(function () {
      var groups = form.querySelectorAll('.form-group');
      for (var i = 0; i < groups.length; i++) {
        groups[i].classList.add('d-none');
      }
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