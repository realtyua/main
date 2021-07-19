(function() {
  'use strict';
  window.addEventListener('load', function() {
    var forms = document.getElementsByClassName('needs-validation');
    var validation = Array.prototype.filter.call(forms, function(form) {
      form.addEventListener('submit', function(event) {
        if (form.checkValidity() === false) {
          form.classList.add('was-validated');
          event.preventDefault();
          event.stopPropagation();
        } else {
          event.preventDefault();
          event.stopPropagation();
          form.classList.remove('was-validated');
          form.reset();
        }
      }, false);
    });
  }, false);
})();

$(document).ready(function() {
  var form = document.getElementById('add-form');
  var checkbox = document.querySelector('input[id="agreeCheck"]');
  var addSubmit = document.getElementById('add-submit');
  var lead = document.querySelector('p.lead');
  var agree = document.getElementById('agree');
  const formRow = document.querySelectorAll('#add-form div.form-row');
  var lengthRow = formRow.length;
  for (var i = 0; i < lengthRow; i++) { if (i !== 0 && i !== 11) { formRow[i].classList.add("d-none"); } }
  lead.classList.add("mb-0");
  addSubmit.classList.add("d-none");
  document.querySelector('p.lead').classList.add("mb-0");
  checkbox.addEventListener('change', (e) => {
      e.preventDefault();
      if (checkbox.checked) {
          for (var i = 0; i < lengthRow; i++) {
              if (i === 0) {
                  formRow[i].classList.add("d-none");
              } else if (i === 11) {
                  formRow[i].classList.remove("d-none");
              } else {
                  formRow[i].classList.remove("d-none");
              }
          }
          addSubmit.classList.remove("d-none");
          lead.classList.add("mb-2");
          agree.textContent = "Так, я приймаю";
      } else {
          for (var i = 0; i < lengthRow; i++) {
              if (i === 0) {
                  formRow[i].classList.remove("d-none");
              } else if (i === 11) {
                  formRow[i].classList.remove("d-none");
              } else {
                  formRow[i].classList.add("d-none");
              }
          }
          lead.classList.remove("mb-2");
          lead.classList.add("mb-0");
          addSubmit.classList.add("d-none");
          agree.textContent = "Прийміть";
      }
  });

  const selectType = document.querySelector("select#typeRealestate");
  var surface = document.getElementById("surface");
  var surfaceLand = document.getElementById("surfaceLand");
  var rooms = document.getElementById("rooms");
  var floor = document.getElementById("floor");
  var floors = document.getElementById("floors");
  selectType.addEventListener("change", (e) => {
      e.preventDefault();
      const typeRealestate = selectType.value;
      if (typeRealestate === "land") {
          surface.setAttribute("readonly", "");
          surface.value = "0";
          surface.min = "0";
          rooms.setAttribute("readonly", "");
          rooms.value = "0";
          rooms.min = "0";
          floor.setAttribute("readonly", "");
          floor.value = "0";
          floors.setAttribute("readonly", "");
          floors.value = "0";
          floors.min = "0";
          formRow[3].classList.add("d-none");
          surfaceLand.placeholder = "Від 1 і більше";
      } else {
          surface.removeAttribute("readonly");
          surface.value = "";
          surface.min = "2";
          rooms.removeAttribute("readonly");
          rooms.value = "";
          rooms.min = "1";
          floor.removeAttribute("readonly");
          floor.value = "";
          floors.removeAttribute("readonly");
          floors.value = "";
          floors.min = "1";
          formRow[3].classList.remove("d-none");
          surfaceLand.placeholder = "Від 0 і більше";
      }
  });

  const selectLocation = document.querySelector("select#typeLocation");
  var selectRegion = document.getElementById("region");
  selectLocation.addEventListener("change", (e) => {
      e.preventDefault();
      const location = selectLocation.value;
      const region = selectRegion.value;
      var lengthRegion = selectRegion.length;
      if (location === "citytown") {
          for (var i = 0; i < lengthRegion; i++) {
              if (i !== 0) {
                  formRow[6].classList.add("d-none");
                  selectRegion[i].setAttribute("disabled", "");
              } else {
                  selectRegion[i].removeAttribute("disabled");
                  selectRegion[i].innerHTML = "Без вибору...";
                  selectRegion[i].value = "none";
              }
          }
      } else {
          for (var i = 0; i < lengthRegion; i++) {
              if (i !== 0) {
                  formRow[6].classList.remove("d-none");
                  selectRegion[i].removeAttribute("disabled");
              } else {
                  selectRegion[i].setAttribute("disabled", "");
                  selectRegion[i].innerHTML = "Виберіть район...";
              }
          }
      }
  });
});

(function ($) {
  $('#add-form').submit(function () {
    var form = this;
    $('#add-submit').html('Надсилаю оголошення<div class="spinner-border spinner-border-sm text-warning ml-2" role="status"><span class="sr-only">Надсилаю...</span></div>');
    $.ajax({
      type: $(this).attr('method'),
      url: $(this).attr('action'),
      data: $(this).serialize(),
      contentType: 'application/x-www-form-urlencoded',
      success: function (data) {
        const formRow = $('#add-form div.form-row');
        var lengthRow = formRow.length;
        for (var i = 0; i < lengthRow; i++) { if (i !== 12) { formRow[i].classList.add("d-none"); } }
        $('h1').html('Оголошення надіслано');
        $('#add-submit').html('Оголошення надіслано');
        $('#add-form .alert').removeClass('alert-danger').addClass('alert-success');
        showAlert('<strong>Дякуємо за надану інформацію!</strong> Ваше оголошення з’явиться на вебсайті після його перевірки.');
        $('p.lead').addClass('d-none');
        $('#add-form #add-submit').addClass('d-none');
        $('#add-form #go-home').removeClass('d-none');
      },
      error: function (err) {
        console.log(err);
        $('#add-submit').html('Надіслати оголошення');
        $('#add-form .alert').removeClass('alert-success').addClass('alert-danger');
        showAlert('<strong>На жаль з вашим поданням сталася помилка</strong>. Переконайтесь, що всі обов’язкові поля помічені червоним кольром заповнені, і спробуйте ще раз.');
        $('#add-form #go-home').addClass('d-none');
      }
    });
    return false;
  });
  function showAlert(message) {
    $('#add-form .alerts').removeClass('d-none');
    $('#add-form .alert-text').html(message);
  }
})(jQuery);
