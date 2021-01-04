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
  var checkbox = document.querySelector('input[id="agreeCheck"]');
  $('#add-form .form-row:not(:first-child)').css('display', 'none');
  $('#add-form .btn').css('display', 'none');
  checkbox.addEventListener('change', (e) => {
    e.preventDefault();
    if (checkbox.checked) {
      $('#add-form .form-row:first-child').css('display', 'none');
      $('#add-form .form-row:not(:first-child)').css('display', 'flex');
      $('#add-form .btn').css('display', 'inline-block');
    } else {
      $('#add-form .form-row:first-child').css('display', 'flex');
      $('#add-form .form-row:not(:first-child)').css('display', 'none');
      $('#add-form .btn').css('display', 'none');
    }
  });
  const selectTL = document.querySelector("select#typeLocation");
  const selectTRE = document.querySelector("select#typeRealestate");
  var region = document.getElementById("region");
  var surface = document.getElementById("surface");
  var surfaceLand = document.getElementById("surfaceLand");
  var rooms = document.getElementById("rooms");
  var floor = document.getElementById("floor");
  var floors = document.getElementById("floors");
  var houseNumber = document.getElementById("houseNumber");
  selectTL.addEventListener("change", (e) => {
    e.preventDefault();
    const valueTL = selectTL.value;
    if (valueTL === "city" || valueTL === "town") {
      region.setAttribute("disabled", "");
      region.removeAttribute("required");
      region.value = "";
    } else {
      region.setAttribute("required", "");
      region.removeAttribute("disabled");
    }
  });
  selectTRE.addEventListener("change", (e) => {
    e.preventDefault();
    const valueTRE = selectTRE.value;
    if (valueTRE === "land") {
      surfaceLand.setAttribute("required", "");
      surfaceLand.removeAttribute("readonly");
      surface.setAttribute("disabled", "");
      surface.removeAttribute("required");
      surface.value = "";
      rooms.setAttribute("disabled", "");
      rooms.removeAttribute("required");
      rooms.value = "";
      floor.setAttribute("disabled", "");
      floor.removeAttribute("required");
      floor.value = "";
      floors.setAttribute("disabled", "");
      floors.removeAttribute("required");
      floors.value = "";
      houseNumber.setAttribute("disabled", "");
      houseNumber.removeAttribute("required");
      houseNumber.value = "";
    } else if (valueTRE === "garage") {
      surface.setAttribute("required", "");
      surface.removeAttribute("disabled");
      surfaceLand.setAttribute("required", "");
      surfaceLand.removeAttribute("disabled");
      rooms.setAttribute("required", "");
      rooms.removeAttribute("disabled");
      floor.setAttribute("required", "");
      floor.removeAttribute("disabled");
      floors.setAttribute("required", "");
      floors.removeAttribute("disabled");
    } else if (valueTRE === "apartment" || valueTRE === "partapartment" || valueTRE === "separateroom") {
      surfaceLand.setAttribute("disabled", "");
      surfaceLand.removeAttribute("required");
      surfaceLand.value = "";
      surface.setAttribute("required", "");
      surface.removeAttribute("disabled");
      rooms.setAttribute("required", "");
      rooms.removeAttribute("disabled");
      floor.setAttribute("required", "");
      floor.removeAttribute("disabled");
      floors.setAttribute("required", "");
      floors.removeAttribute("disabled");
      houseNumber.setAttribute("required", "");
      houseNumber.removeAttribute("disabled");
    } else {
      surface.setAttribute("required", "");
      surface.removeAttribute("disabled");
      surfaceLand.setAttribute("required", "");
      surfaceLand.removeAttribute("disabled");
      rooms.setAttribute("required", "");
      rooms.removeAttribute("disabled");
      floor.setAttribute("required", "");
      floor.removeAttribute("disabled");
      floors.setAttribute("required", "");
      floors.removeAttribute("disabled");
      houseNumber.setAttribute("required", "");
      houseNumber.removeAttribute("disabled");
    }
  });
});

(function ($) {
  var $comments = $('#add-form');

  $('#add-form').submit(function () {
    var form = this;

    $(form).addClass('disabled');
    $('#add-submit').html('Надсилаю<div class="spinner-border spinner-border-sm text-warning ml-2" role="status"><span class="sr-only">Надсилаю...</span></div>');

    $.ajax({
      type: $(this).attr('method'),
      url: $(this).attr('action'),
      data: $(this).serialize(),
      contentType: 'application/x-www-form-urlencoded',
      success: function (data) {
        $('#add-submit').html('Надіслано');
        $('#add-form .alert').removeClass('alert-danger').addClass('alert-success');
        showAlert('<strong>Thanks for your comment!</strong> It will show on the site once it has been approved.');
        grecaptcha.reset();
      },
      error: function (err) {
        console.log(err);
        $('#add-submit').html('Надіслати');
        $('#add-form .alert').removeClass('alert-success').addClass('alert-danger');
        showAlert('<strong>Sorry, there was an error with your submission.</strong> Please make sure all required fields have been completed and try again.');
        $(form).removeClass('disabled');
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
