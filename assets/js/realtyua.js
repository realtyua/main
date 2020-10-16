
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

function generateRandomRe() {
    $.getJSON("https://www.realestate.if.ua/region/city/ivano-frankivsk/data/all.json", function(data) {

        var count = data.length;
        var random = [];
        var counter = 0;
        var number = 3;
        var div = $("#ads");

        div.append();

        while (counter < number) {

            var i = Math.floor(Math.random() * count);

            if (random.indexOf(i) == "-1") {

                if (counter == (number - 1)) {
                  if (data[i].type === 'Квартира') {
                    div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю Квартиру ' + data[i].id + ' загальною площею ' + data[i].surface + ' м<sup>2</sup></p></div></div>');
                  } else if (data[i].type === 'Частина будинку') {
                    div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю частину будинку, ' + data[i].id + '</p></div></div>');
                  } else {
                    div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю ' + data[i].type + ', ' + data[i].id + '</p></div></div>');
                  }
                } else {
                  if (data[i].type === 'Квартира') {
                    div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю Квартиру ' + data[i].id + ' загальною площею ' + data[i].surface + ' м<sup>2</sup></p></div></div>');
                  } else if (data[i].type === 'Частина будинку') {
                    div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю частину будинку, ' + data[i].id + '</p></div></div>');
                  } else {
                    div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю ' + data[i].type + ', ' + data[i].id + '</p></div></div>');
                  }
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
