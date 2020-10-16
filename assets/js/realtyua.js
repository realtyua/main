
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
});

$('.nav-tabs>li>a.nav-link').on('click', function(){
    $('.navbar-collapse').collapse('hide');
})

$(document).on('click', function (e) {
    if ($(e.target).closest(".card").length === 0) {
        $('.collapse').collapse('hide');
    }
});

$(document).ready(function(){
  $('.toast').toast('show');
  $('.alert').alert();
});

function generateRandomRe()
  {
      $.getJSON("https://www.realestate.if.ua/region/city/ivano-frankivsk/data/all.json", function(data) {

          var count = data.length;
          var random = [];
          var counter = 0;
          var number = 3;
          var div = $("#ads");

          div.append('<h4>Зверніть увагу</h4>');

          while (counter < number) {

              var i = Math.floor(Math.random() * count);

              if (random.indexOf(i) == "-1") {

                  if (counter == (number - 1)) {
                    if (data[i].type === 'Квартира') {
                      div.append('<p><a href="#">Продаю Квартиру ' + data[i].id + '</a></p>');
                    } else if (data[i].type === 'Частина будинку') {
                      div.append('<p><a href="#">Продаю частину будинку, ' + data[i].id + '</a></p>');
                    } else {
                      div.append('<p><a href="#">Продаю ' + data[i].type + ', ' + data[i].id + '</a></p>');
                    }
                  } else {
                      div.append('<p><a href="#">Продаю ' + data[i].type + ', ' + data[i].id + '</a></p>');
                  }

                  random.push(i);

                  counter++;
              }
          }
      });
  }

  $(document).ready(function() {
      generateRandomRe();
  });
