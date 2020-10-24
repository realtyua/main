---
layout: null
---

function generateRandomRe() {
  $.getJSON("https://www.realestate.if.ua/region/city/ivano-frankivsk/data/all.json", function(data) {
    var count = data.length;
    var random = [];
    var counter = 0;
    var number = 3;
    var div = $("#ads");
    var usd = {{ site.usd }};
    var eur = {{ site.eur }};

    function reAdsPrice() {
      if (data[i].price !== '' && data[i].price.indexOf('$') !== -1) {
        return '{{ site.data.lang-uk.re_cost }} ' + (data[i].price.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}';
      } else if (data[i].price !== '' && data[i].price.indexOf('€') !== -1) {
        return '{{ site.data.lang-uk.re_cost }} ' + (data[i].price.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}';
      } else if (data[i].price !== '') {
        return '{{ site.data.lang-uk.re_cost }} ' + (data[i].price * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}';
      }
    }

    function reAdsPrice() {
      if (data[i].price !== '' && data[i].price.indexOf('$') !== -1) {
        return '{{ site.data.lang-uk.re_cost }} ' + (data[i].price.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}';
      } else if (data[i].price !== '' && data[i].price.indexOf('€') !== -1) {
        return '{{ site.data.lang-uk.re_cost }} ' + (data[i].price.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}';
      } else if (data[i].price !== '') {
        return '{{ site.data.lang-uk.re_cost }} ' + (data[i].price * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}';
      }
    }

    function reAdsPriceSqmt() {
      if (data[i].price_sqmt !== '' && data[i].price_sqmt.indexOf('$') !== -1) {
        return '{{ site.data.lang-uk.re_cost }} ' + (data[i].price_sqmt.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}';
      } else if (data[i].price_sqmt !== '' && data[i].price_sqmt.indexOf('€') !== -1) {
        return '{{ site.data.lang-uk.re_cost }} ' + (data[i].price_sqmt.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}';
      } else if (data[i].price_sqmt !== '') {
        return '{{ site.data.lang-uk.re_cost }} ' + (data[i].price_sqmt * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}';
      }
    }

    function reAdsTel() {
      return '{{ site.data.lang-uk.re_tel }} <a href="tel:+' + data[i].phone + '">+' + data[i].phone.substr(0, 2) + '&nbsp;' + data[i].phone.substr(2, 3) + '&nbsp;' + data[i].phone.substr(5, 3) + '&nbsp;' + data[i].phone.substr(8, 2) + '&nbsp;' + data[i].phone.substr(10, 2) + '</a>';
    }

    function reAdsType() {
      if (data[i].type === 'Квартира') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю квартиру загальною площею ' + data[i].surface + '&nbsp;м<sup>2</sup>, кімнат ' + data[i].rooms + ', на ' + data[i].floor + '-му поверсі за адресою ' + data[i].address + ' в ' + data[i].location + ', ' + reAdsPrice() + ', ' + reAdsTel() + '</p></div></div>');
      } else if (data[i].rent === '1' && data[i].price !== '' && data[i].type === 'Магазин') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Здається в оренду ' + data[i].type +  ' загальною площею ' + data[i].surface + '&nbsp;м<sup>2</sup> на ' + data[i].floor + '-му поверсі за адресою ' + data[i].address + ' в ' + data[i].location + ', ' + reAdsPrice() + ' за місяць, ' + reAdsTel() + '</p></div></div>');
      } else if (data[i].rent === '1' && data[i].price !== '' && data[i].type !== 'Магазин') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Здається в оренду ' + data[i].type +  ' загальною площею ' + data[i].surface + '&nbsp;м<sup>2</sup>, на ' + data[i].floor + '-му поверсі за адресою ' + data[i].address + ' в ' + data[i].location + ', ' + reAdsPrice() + ' за місяць, ' + reAdsTel() + '</p></div></div>');
      } else if (data[i].rent === '1' && data[i].price === '' && data[i].price_sqmt !== '') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Здається в оренду на не тривалий термін ' + data[i].type +  ' загальною площею ' + data[i].surface + '&nbsp;м<sup>2</sup>, кімнат ' + data[i].rooms + ', на ' + data[i].floor + '-му поверсі за адресою ' + data[i].address + ' в ' + data[i].location + ', ' + reAdsPriceSqmt() + ', ' + reAdsTel() + '</p></div></div>');
      } else if (data[i].type === 'Частина будинку') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю частину будинку загальною площею ' + data[i].surface + '&nbsp;м<sup>2</sup>, кімнат ' + data[i].rooms + ', на ' + data[i].floor + '-му поверсі за адресою ' + data[i].address + ' в ' + data[i].location + ', ' + reAdsPrice() + ', ' + reAdsTel() + '</p></div></div>');
      } else if (data[i].type === 'Земля') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю землю площею ' + data[i].surface_land + '&nbsp;м<sup>2</sup> за адресою ' + data[i].address + ' в ' + data[i].location + ', ' + reAdsPrice() + ', ' + reAdsTel() + '</p></div></div>');
      } else if (data[i].type === 'Гараж' || data[i].type === 'Магазин') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю ' + data[i].type + ' площею ' + data[i].surface + '&nbsp;м<sup>2</sup> за адресою ' + data[i].address + ' в ' + data[i].location + ', ' + reAdsPrice() + ', ' + reAdsTel() + '</p></div></div>');
      } else if (data[i].type === 'Нежитлове приміщення') {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю ' + data[i].type + ' загальною площею ' + data[i].surface + '&nbsp;м<sup>2</sup> на ' + data[i].floor + '-му поверсі за адресою ' + data[i].address + ' в ' + data[i].location + ', ' + reAdsPrice() + ', ' + reAdsTel() + '</p></div></div>');
      } else {
        div.append('<div class="card"><div class="card-body"><p class="card-text">Продаю ' + data[i].type + ' загальною площею ' + data[i].surface + '&nbsp;м<sup>2</sup>, кімнат ' + data[i].rooms + ', поверхів ' + data[i].floor + ' за адресою ' + data[i].address + ' в ' + data[i].location + ', ' + reAdsPrice() + ', ' + reAdsTel() + '</p></div></div>');
      }
    }

    div.append();
    while (counter < number) { var i = Math.floor(Math.random() * count); if (random.indexOf(i) == "-1") { if (counter == (number - 1)) { reAdsType(); } else { reAdsType(); } random.push(i); counter++; } }
  });
}
$(document).ready(function() { generateRandomRe(); });
