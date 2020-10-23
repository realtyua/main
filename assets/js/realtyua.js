---
layout: null
---

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
    var usd = {{ site.usd }};
    var eur = {{ site.eur }};
    var price = 0;

    var t = function() {
      return 'телефон <a href="tel:+' + data[i].phone + '">+' + data[i].phone.substr(0, 2) + '&nbsp;' + data[i].phone.substr(2, 3) + '&nbsp;' + data[i].phone.substr(5, 3) + '&nbsp;' + data[i].phone.substr(8, 2) + '&nbsp;' + data[i].phone.substr(10, 2) + '</a>';
    }

    // var tel = 'телефон <a href="tel:+' + data[i].phone + '">+' + data[i].phone.substr(0, 2) + '&nbsp;' + data[i].phone.substr(2, 3) + '&nbsp;' + data[i].phone.substr(5, 3) + '&nbsp;' + data[i].phone.substr(8, 2) + '&nbsp;' + data[i].phone.substr(10, 2) + '</a>';

    function reAdsType() {
      if (data[i].type === 'Квартира') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю квартиру загальною площею ' + data[i].surface + '&nbsp;м<sup>2</sup>, кімнат ' + data[i].floor + ', на ' + data[i].floors + '-му поверсі за адресою ' + data[i].address + ' в ' + data[i].location + ', ціна, телефон <a href="tel:+' + data[i].phone + '">+' + data[i].phone.substr(0,2) + '&nbsp;' + data[i].phone.substr(2,3) + '&nbsp;' + data[i].phone.substr(5,3) + '&nbsp;' + data[i].phone.substr(8,2) + '&nbsp;' + data[i].phone.substr(10,2) + '</a></p></div></div>');
      } else if (data[i].type === 'Частина будинку') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю частину будинку загальною площею ' + data[i].surface + '&nbsp;м<sup>2</sup>, кімнат ' + data[i].floor + ', на ' + data[i].floors + '-му поверсі за адресою ' + data[i].address + ' в ' + data[i].location + ', ціна, </p></div></div>');
      } else if (data[i].type === 'Земля') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю землю площею ' + data[i].surface_land + '&nbsp;м<sup>2</sup> за адресою ' + data[i].address + ' в ' + data[i].location + ', ціна, ' + t + '</p></div></div>');
      } else if (data[i].type === 'Гараж' || data[i].type === 'Магазин') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю ' + data[i].type + ' площею ' + data[i].surface + '&nbsp;м<sup>2</sup> за адресою ' + data[i].address + ' в ' + data[i].location + ', ціна, </p></div></div>');
      } else if (data[i].type === 'Нежитлове приміщення') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю ' + data[i].type + ' загальною площею ' + data[i].surface + '&nbsp;м<sup>2</sup>, кімнат ' + data[i].floor + ', на ' + data[i].floors + '-му поверсі за адресою ' + data[i].address + ' в ' + data[i].location + ', ціна, </p></div></div>');
      } else {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю ' + data[i].type + ' загальною площею ' + data[i].surface + '&nbsp;м<sup>2</sup>, кімнат ' + data[i].floor + ', поверхів ' + data[i].floors + ' за адресою ' + data[i].address + ' в ' + data[i].location + ', ціна, </p></div></div>');
      }
    }

    div.append();

    while (counter < number) {
      var i = Math.floor(Math.random() * count);
      if (random.indexOf(i) == "-1") { if (counter == (number - 1)) { reAdsType(); } else { reAdsType(); } random.push(i); counter++; }
    }

  });
}

$(document).ready(function() {
  generateRandomRe();
});
