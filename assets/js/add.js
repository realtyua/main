(function() {
  "use strict";
  window.addEventListener("load", function() {
    var forms = document.getElementsByClassName("needs-validation");
    var validation = Array.prototype.filter.call(forms, function(form) {
      form.addEventListener("submit", function(event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add("was-validated");
      }, false);
    });
  }, false);
})();

$(document).ready(function() {
    var form = document.getElementById('add-form');
    var checkbox = document.querySelector('input[id="agreeCheck"]');
    var btn = document.querySelector('#add-form .btn');
    var lead = document.querySelector('p.lead');
    const formRow = document.querySelectorAll('#add-form div.form-row');
    var length = formRow.length;
    for (var i = 0; i < length; i++) {
        if (i !== 0) {
            formRow[i].style.display = "none";
        }
    }
    lead.classList.add("mb-0");
    btn.style.display = "none";
    document.querySelector('p.lead').classList.add("mb-0");
    checkbox.addEventListener('change', (e) => {
        e.preventDefault();
        if (checkbox.checked) {
            for (var i = 0; i < length; i++) {
                if (i === 0) {
                    formRow[i].style.display = "none";
                } else {
                    formRow[i].removeAttribute("style");
                }
            }
            btn.removeAttribute("style");
            lead.classList.add("mb-2");
        } else {
            for (var i = 0; i < length; i++) {
                if (i === 0) {
                    formRow[i].removeAttribute("style");
                } else {
                    formRow[i].style.display = "none";
                }
            }
            lead.classList.remove("mb-2");
            lead.classList.add("mb-0");
            btn.style.display = "none";
        }
    });
    const selectType = document.querySelector("select#typeLocation");
    var district = document.getElementById("region");
    selectType.addEventListener("change", (e) => {
        e.preventDefault();
        const typeLocation = selectType.value;
        if (typeLocation === "city" || typeLocation === "town") {
            district.setAttribute("disabled", "");
            district.removeAttribute("required");
            district.value = "";
        } else {
            district.setAttribute("required", "");
            district.removeAttribute("disabled");
        }
    });
});

(function ($) {
  var $comments = $('#add-form');

  $('#add-form').submit(function () {
    var form = this;

    $(form).addClass('disabled');
    $('#add-submit').html('Надсилаю оголошення<div class="spinner-border spinner-border-sm text-warning ml-2" role="status"><span class="sr-only">Надсилаю...</span></div>');

    $.ajax({
      type: $(this).attr('method'),
      url: $(this).attr('action'),
      data: $(this).serialize(),
      contentType: 'application/x-www-form-urlencoded',
      success: function (data) {
        $('#add-submit').html('Оголошення надіслано');
        $('#add-form .alert').removeClass('alert-danger').addClass('alert-success');
        showAlert('<strong>Дякуємо за надану інформацію!</strong> Ваше оголошення з’явиться на вебсайті після його перевірки.');
        document.getElementById('add-form').reset();
        grecaptcha.reset();
      },
      error: function (err) {
        console.log(err);
        $('#add-submit').html('Надіслати оголошення');
        $('#add-form .alert').removeClass('alert-success').addClass('alert-danger');
        showAlert('<strong>На жаль з вашим поданням сталася помилка</strong>. Переконайтесь, що всі обов’язкові поля помічені червоним кольром заповнені, і спробуйте ще раз.');
        $(form).removeClass('disabled');
        document.getElementById('add-form').reset();
        grecaptcha.reset();
      }
    });

    return false;
  });

  function showAlert(message) {
    $('#add-form .alerts').removeClass('d-none');
    $('#add-form .alert-text').html(message);
  }
})(jQuery);
