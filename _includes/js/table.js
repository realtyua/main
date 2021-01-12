
$(function () {
  "use strict";
  var expandedRow = null;
  if ($('div.pswp').length < 1 && $('table#property').length > 0) {
      var photoswipeTemplate = '\
          <div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">\
              <div class="pswp__bg"></div>\
              <div class="pswp__scroll-wrap">\
                  <div class="pswp__container">\
                      <div class="pswp__item"></div>\
                      <div class="pswp__item"></div>\
                      <div class="pswp__item"></div>\
                  </div>\
                  <div class="pswp__ui pswp__ui--hidden">\
                      <div class="pswp__top-bar">\
                          <div class="pswp__counter"></div>\
                          <button class="pswp__button pswp__button--close" title="Close (Esc)"></button>\
                          <button class="pswp__button pswp__button--share" title="Share"></button>\
                          <button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>\
                          <button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button>\
                          <div class="pswp__preloader">\
                              <div class="pswp__preloader__icn">\
                                  <div class="pswp__preloader__cut">\
                                      <div class="pswp__preloader__donut"></div>\
                                  </div>\
                              </div>\
                          </div>\
                      </div>\
                      <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">\
                          <div class="pswp__share-tooltip"></div> \
                      </div>\
                      <button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)"></button>\
                      <button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)"></button>\
                      <div class="pswp__caption">\
                          <div class="pswp__caption__center"></div>\
                      </div>\
                  </div>\
              </div>\
          </div>';
      $('body').append(photoswipeTemplate);
  }
  $('table#property').on('expand-row.bs.table', function (event, index) { if (expandedRow !== index) { $('table').bootstrapTable('collapseRow', expandedRow); } expandedRow = index; });
  $('table#property').on('click-row.bs.table', function (e, row, $element) { $($element).siblings().removeClass('active'); $($element).addClass('active'); });
});

var month = ["{{ site.data.lang-uk.m_01 }}","{{ site.data.lang-uk.m_02 }}","{{ site.data.lang-uk.m_03 }}","{{ site.data.lang-uk.m_04 }}","{{ site.data.lang-uk.m_05 }}","{{ site.data.lang-uk.m_06 }}","{{ site.data.lang-uk.m_07 }}","{{ site.data.lang-uk.m_08 }}","{{ site.data.lang-uk.m_09 }}","{{ site.data.lang-uk.m_10 }}","{{ site.data.lang-uk.m_11 }}","{{ site.data.lang-uk.m_12 }}"];
var usd = {{ site.usd }};
var eur = {{ site.eur }};
var items = [];
var html = [];

function jsDetailFormatter(index, row, $detail) {

  "use strict";
  var d = new Date(row.date);
  var n = d.getMonth();

  $.each(row, function (key, value) {
    if (key !== 'images' || key !== 'id' && value !== '') {
      if (row.type.indexOf('{{ site.data.lang-uk.re_land }}') !== -1 || row.type.indexOf('{{ site.data.lang-uk.re_land | downcase }}') !== -1) {
        html = [
          '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">',
          '<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_surface_land }}</dt><dd>' + row.surface_land + ' {{ site.data.lang-uk.re_m }}<sup>2</sup></dd></dl></span>',
        ]
        if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        }
        if (row.coordinates && row.coordinates !== '') {
          html.push('<span class="col px-1"><dl><dt>' + row.type + ' {{ site.data.lang-uk.re_on_map }}</dt><dd><a class="marker" data-coord="' + row.coordinates + '" data-toggle="modal" data-target="#reMap" href="#reMap" aria-haspopup="true" aria-expanded="false">{{ site.data.lang-uk.re_show_map }}</a></dd></dl></span>')
        }
        if (row.date !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_date }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_seller }}</dt><dd>' + row.seller + '</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_phone }}</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
          html.push('</span>')
        }
        if (row.description && row.description !== '') {
          html.push('<span class="row mx-n1">'),
          html.push('<span class="col-12 px-1"><dl><dt>{{ site.data.lang-uk.re_description }}</dt><dd>' + row.description + '</dd></dl></span>'),
          html.push('</span>')
        }
      } else if (row.rent && row.rent !== '' && row.rent === '1') {
        html = [
          '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">'
        ]
        if (row.floor !== '' && row.floors !== '' && row.type.indexOf('{{ site.data.lang-uk.re_house }}') === -1 || row.type.indexOf('{{ site.data.lang-uk.re_house_not }}') === -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_floor }}</dt><dd>' + row.floor + ' {{ site.data.lang-uk.re_at }} ' + row.floors + ' {{ site.data.lang-uk.re_floors }}</dd></dl></span>')
        }
        if (row.parking !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_parking }}</dt><dd>' + row.parking + '</dd></dl></span>')
        }
        if (row.object && row.object !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_object }}</dt><dd>' + row.object + '</dd></dl></span>')
        }
        if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        }
        if (row.coordinates && row.coordinates !== '') {
          html.push('<span class="col px-1"><dl><dt>' + row.type + ' {{ site.data.lang-uk.re_on_map }}</dt><dd><a class="marker" data-coord="' + row.coordinates + '" data-toggle="modal" data-target="#reMap" href="#reMap" aria-haspopup="true" aria-expanded="false">{{ site.data.lang-uk.re_show_map }}</a></dd></dl></span>')
        }
        if (row.date !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_dater }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_sellerr }}</dt><dd>' + row.seller + '</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_phoner }}</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
          html.push('</span>')
        }
        if (row.description && row.description !== '') {
          html.push('<span class="row mx-n1">'),
          html.push('<span class="col-12 px-1"><dl><dt>{{ site.data.lang-uk.re_description }}</dt><dd>' + row.description + '</dd></dl></span>'),
          html.push('</span>')
        }
      } else {
        html = [
          '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">',
        ]
        if (row.surface_land !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_surface_land }}</dt><dd>' + row.surface_land + ' {{ site.data.lang-uk.re_m }}<sup>2</sup></dd></dl></span>')
        }
        if (row.floor !== '' && row.floors !== '' && row.type.indexOf('{{ site.data.lang-uk.re_house }}') === -1 || row.type.indexOf('{{ site.data.lang-uk.re_house_not }}') === -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_floor }}</dt><dd>' + row.floor + ' {{ site.data.lang-uk.re_at }} ' + row.floors + ' {{ site.data.lang-uk.re_floors }}</dd></dl></span>')
        }
        if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        }
        if (row.parking !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_parking }}</dt><dd>' + row.parking + '</dd></dl></span>')
        }
        if (row.object && row.object !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_object }}</dt><dd>' + row.object + '</dd></dl></span>')
        }
        if (row.coordinates && row.coordinates !== '') {
          html.push('<span class="col px-1"><dl><dt>' + row.type + ' {{ site.data.lang-uk.re_on_map }}</dt><dd><a class="marker" data-coord="' + row.coordinates + '" data-toggle="modal" data-target="#reMap" href="#reMap" aria-haspopup="true" aria-expanded="false">{{ site.data.lang-uk.re_show_map }}</a></dd></dl></span>')
        }
        if (row.date !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_date }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>')
        }
        if (row.phone !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_seller }}</dt><dd>' + row.seller + '</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_phone }}</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
          html.push('</span>')
        }
        if (row.description && row.description !== '') {
          html.push('<span class="row mx-n1">'),
          html.push('<span class="col-12 px-1"><dl><dt>{{ site.data.lang-uk.re_description }}</dt><dd>' + row.description + '</dd></dl></span>'),
          html.push('</span>')
        }
      }
    }
  })

  const images = Object.values(row.images || {});

  if (images.length) {
    var region = row.region.replace('кий', 'кому');
    var district = region.replace('район', 'районі');
    html.push('<hr class="mt-0"><span class="row row-cols-1 row-cols-sm-2 row-cols-md-4 mx-n1">'),
    html.push(images.map(function (image) {
      return '<figure class="col px-1"><a href="/assets/images/' + row.phone + '/' + row.id + '/' + image.src + '" class="lightbox" title="' + image.title + '" data-lightbox-caption="{{ site.data.lang-uk.re_free_ads_in }} ' + row.location + '' + district + '" data-lightbox-width="1024" data-lightbox-height="768" data-lightbox-group="re-' + row.id + '4' + row.phone + '"><img src="/assets/images/' + row.phone + '/' + row.id + '/' + image.src + '" loading="lazy" title="' + image.title + '" alt="' + image.alt + '" class="img-fluid img-thumbnail" intrinsicsize="1024x768"></a></figure>'
    }).join('')),
    html.push('</span>')
  }

  $detail.html(html.join(''))

}

function htmlDetailFormatter(index, row, $detail) {

  "use strict";
  var d = new Date(row.date);
  var n = d.getMonth();
  var images = [];

  $(row.images).find('.col a.lightbox').each(function () {
    images.push($(this).attr('href'))
  })

  $.each(row, function (key, value) {
    if (key !== 'images' || key !== 'id' && value !== '') {
      if (row.type.indexOf('{{ site.data.lang-uk.re_land }}') !== -1 || row.type.indexOf('{{ site.data.lang-uk.re_land | downcase }}') !== -1) {
        html = [
          '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">',
          '<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_surface_land }}</dt><dd>' + row.surface_land + ' {{ site.data.lang-uk.re_m }}<sup>2</sup></dd></dl></span>',
        ]
        if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        }
        if (row.coordinates && row.coordinates !== '') {
          html.push('<span class="col px-1"><dl><dt>' + row.type + ' {{ site.data.lang-uk.re_on_map }}</dt><dd><a class="marker" data-coord="' + row.coordinates + '" data-toggle="modal" data-target="#reMap" href="#reMap" aria-haspopup="true" aria-expanded="false">{{ site.data.lang-uk.re_show_map }}</a></dd></dl></span>')
        }
        if (row.date !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_date }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_seller }}</dt><dd>' + row.seller + '</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_phone }}</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
          html.push('</span>')
        }
        if (row.description && row.description !== '') {
          html.push('<span class="row mx-n1">'),
          html.push('<span class="col-12 px-1"><dl><dt>{{ site.data.lang-uk.re_description }}</dt><dd>' + row.description + '</dd></dl></span>'),
          html.push('</span>')
        }
      } else if (row.rent && row.rent !== '' && row.rent === '1') {
        html = [
          '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">'
        ]
        if (row.floor !== '' && row.floors !== '' && row.type.indexOf('{{ site.data.lang-uk.re_house }}') === -1 || row.type.indexOf('{{ site.data.lang-uk.re_house_not }}') === -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_floor }}</dt><dd>' + row.floor + ' {{ site.data.lang-uk.re_at }} ' + row.floors + ' {{ site.data.lang-uk.re_floors }}</dd></dl></span>')
        }
        if (row.parking !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_parking }}</dt><dd>' + row.parking + '</dd></dl></span>')
        }
        if (row.object && row.object !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_object }}</dt><dd>' + row.object + '</dd></dl></span>')
        }
        if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        }
        if (row.coordinates && row.coordinates !== '') {
          html.push('<span class="col px-1"><dl><dt>' + row.type + ' {{ site.data.lang-uk.re_on_map }}</dt><dd><a class="marker" data-coord="' + row.coordinates + '" data-toggle="modal" data-target="#reMap" href="#reMap" aria-haspopup="true" aria-expanded="false">{{ site.data.lang-uk.re_show_map }}</a></dd></dl></span>')
        }
        if (row.date !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_dater }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_sellerr }}</dt><dd>' + row.seller + '</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_phoner }}</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
          html.push('</span>')
        }
        if (row.description && row.description !== '') {
          html.push('<span class="row mx-n1">'),
          html.push('<span class="col-12 px-1"><dl><dt>{{ site.data.lang-uk.re_description }}</dt><dd>' + row.description + '</dd></dl></span>'),
          html.push('</span>')
        }
      } else {
        html = [
          '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">',
        ]
        if (row.surface_land !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_surface_land }}</dt><dd>' + row.surface_land + ' {{ site.data.lang-uk.re_m }}<sup>2</sup></dd></dl></span>')
        }
        if (row.floor !== '' && row.floors !== '' && row.type.indexOf('{{ site.data.lang-uk.re_house }}') === -1 || row.type.indexOf('{{ site.data.lang-uk.re_house_not }}') === -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_floor }}</dt><dd>' + row.floor + ' {{ site.data.lang-uk.re_at }} ' + row.floors + ' {{ site.data.lang-uk.re_floors }}</dd></dl></span>')
        }
        if (row.parking !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_parking }}</dt><dd>' + row.parking + '</dd></dl></span>')
        }
        if (row.object && row.object !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_object }}</dt><dd>' + row.object + '</dd></dl></span>')
        }
        if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        }
        if (row.coordinates && row.coordinates !== '') {
          html.push('<span class="col px-1"><dl><dt>' + row.type + ' {{ site.data.lang-uk.re_on_map }}</dt><dd><a class="marker" data-coord="' + row.coordinates + '" data-toggle="modal" data-target="#reMap" href="#reMap" aria-haspopup="true" aria-expanded="false">{{ site.data.lang-uk.re_show_map }}</a></dd></dl></span>')
        }
        if (row.date !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_date }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>')
        }
        if (row.phone !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_seller }}</dt><dd>' + row.seller + '</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_phone }}</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
          html.push('</span>')
        }
        if (row.description && row.description !== '') {
          html.push('<span class="row mx-n1">'),
          html.push('<span class="col-12 px-1"><dl><dt>{{ site.data.lang-uk.re_description }}</dt><dd>' + row.description + '</dd></dl></span>'),
          html.push('</span>')
        }
      }
    }
  })

  if (images.length) {
    var address = (row.address.indexOf('{{ site.data.lang-uk.re_vul }}') !== -1) ? ' {{ site.data.lang-uk.re_po }} ' + row.address : ' {{ site.data.lang-uk.re_at }} ' + row.address;
    var region = row.region.replace('кий', 'кому');
    var district = region.replace('район', 'районі');
    html.push('<hr class="mt-0"><span class="row row-cols-1 row-cols-sm-2 row-cols-md-4 mx-n1">'),
    html.push(images.map(function (image) {
      return '<figure class="col px-1"><a href="' + image + '" class="lightbox" title="' + row.type + '' + address + ' в ' + row.location + '' + district + '" data-lightbox-caption="{{ site.data.lang-uk.re_free_ads_in }} ' + row.location + '' + district + '" data-lightbox-width="1024" data-lightbox-height="768" data-lightbox-group="re-' + row.id + '4' + row.phone + '"><img src="' + image + '" loading="lazy" title="' + row.type + ' по ' + row.address + ' в ' + row.location + '' + district + '" alt="' + row.type + ' в ' + row.location + '' + district + '" class="img-fluid img-thumbnail" intrinsicsize="1024x768"></a></figure>'
    }).join('')),
    html.push('</span>')
  }

  $detail.html(html.join(''))

}

function propertyFormatter(value, row) {
  "use strict";
  if (value !== '') {
    if (row.type.indexOf('{{ site.data.lang-uk.re_land }}') !== -1 || row.type.indexOf('{{ site.data.lang-uk.re_land | downcase }}') !== -1) {
      html = ['{{ site.data.lang-uk.re_for_sale }} <strong class="text-lowercase">' + row.type + '</strong>, ']
      if (row.surface_land && row.surface_land !== '') { html.push('{{ site.data.lang-uk.re_surface }} <strong>' + row.surface_land + ' {{ site.data.lang-uk.re_m }}</strong><sup>2</sup>') }
      if (row.location && row.location !== '') { html.push(', ' + row.location + '') }
      if (row.address && row.address !== '') { html.push(', {{ site.data.lang-uk.re_location }} <strong>' + row.address + '</strong>') }
      if (row.region && row.region !== '') { html.push(', ' + row.region + '.') }
    } else if (row.rent !== '' && row.rent === '1' && row.price !== '') {
      html = ['{{ site.data.lang-uk.re_for_rent }} <strong class="text-lowercase">' + row.type + '</strong>, ']
      if (row.surface && row.surface !== '') {
        html.push('{{ site.data.lang-uk.re_surface }} <strong>' + row.surface + ' {{ site.data.lang-uk.re_m }}</strong><sup>2</sup>, ')
      }
      if (row.rooms && row.rooms !== '') {
        html.push('{{ site.data.lang-uk.re_rooms }} ' + row.rooms + ', ')
      }
      if (row.floor && row.floor !== '') {
        html.push('{{ site.data.lang-uk.re_na }} <strong>' + row.floor + '</strong>{{ site.data.lang-uk.re_mu }} {{ site.data.lang-uk.re_floorci }}, ')
      }
      if (row.floor === '' && row.floors !== '') {
        html.push('{{ site.data.lang-uk.re_at }} <strong>' + row.floors + '</strong> {{ site.data.lang-uk.re_floors }}, ')
      }
      if (row.location && row.location !== '') {
        html.push('{{ site.data.lang-uk.re_location }} <strong>' + row.location + '</strong>, {{ site.data.lang-uk.re_address }} <strong>' + row.address + '</strong>')
      }
    } else if (row.rent !== '' && row.rent === '1' && row.price === '' && row.price_sqmt !== '') {
      html = ['{{ site.data.lang-uk.re_for_rentd }} <strong class="text-lowercase">' + row.type + '</strong>, ']
      if (row.surface && row.surface !== '') {
        html.push('{{ site.data.lang-uk.re_surface }} <strong>' + row.surface + ' {{ site.data.lang-uk.re_m }}</strong><sup>2</sup>, ')
      }
      if (row.rooms && row.rooms !== '') {
        html.push('{{ site.data.lang-uk.re_rooms }} ' + row.rooms + ', ')
      }
      if (row.floor && row.floor !== '') {
        html.push('{{ site.data.lang-uk.re_na }} <strong>' + row.floor + '</strong>{{ site.data.lang-uk.re_mu }} {{ site.data.lang-uk.re_floorci }}, ')
      }
      if (row.floor === '' && row.floors !== '') {
        html.push('{{ site.data.lang-uk.re_at }} <strong>' + row.floors + '</strong> {{ site.data.lang-uk.re_floors }}, ')
      }
      if (row.location && row.location !== '') {
        html.push('{{ site.data.lang-uk.re_location }} <strong>' + row.location + '</strong>, {{ site.data.lang-uk.re_address }} <strong>' + row.address + '</strong>.')
      }
    } else {
      html = ['{{ site.data.lang-uk.re_for_sale }} <strong class="text-lowercase">' + row.type + '</strong>, ']
      if (row.surface && row.surface !== '') {
        html.push('{{ site.data.lang-uk.re_surface }} <strong>' + row.surface + ' {{ site.data.lang-uk.re_m }}</strong><sup>2</sup>, ')
      }
      if (row.rooms && row.rooms !== '') {
        html.push('{{ site.data.lang-uk.re_rooms }} ' + row.rooms + ', ')
      }
      if (row.type.indexOf('{{ site.data.lang-uk.re_house }}') !== -1 || row.type.indexOf('{{ site.data.lang-uk.re_house_not }}') !== -1) {
        if (row.floors && row.floors !== '') {
          html.push('{{ site.data.lang-uk.re_floorss }} <strong>' + row.floors + '</strong>, ')
        }
      } else {
        if (row.floor && row.floor !== '') {
          html.push('{{ site.data.lang-uk.re_na }} <strong>' + row.floor + '</strong>{{ site.data.lang-uk.re_mu }} {{ site.data.lang-uk.re_floorci }}, ')
        }
      }
      if (row.region && row.region !== '' && row.region.indexOf('район') !== -1) {
        if (row.region && row.region !== '') {
          html.push('{{ site.data.lang-uk.re_address }} <strong>' + row.address + ', ' + row.region + '</strong>.')
        }
        if (row.page && row.page === '1') {
          html.push(' <a href=/' + row.phone + '>Сторінка оголошення</a>.')
        }
      } else {
        if (row.location && row.location !== '') {
          html.push('{{ site.data.lang-uk.re_location }} <strong>' + row.location + '</strong>, {{ site.data.lang-uk.re_address }} <strong>' + row.address + '</strong>.')
        }
        if (row.page && row.page === '1') {
          html.push(' <a href="{{ site.url }}/' + row.phone + '" target="_blank">Сторінка оголошення</a>.')
        }
      }
    }
  }
  return html.join('')
}

function priceFormatter(value, row) {
  "use strict";
  if (value !== '' && value.indexOf('$') !== -1) {
    return '<span data-toggle="tooltip" title="' + value + '">' + (value.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</span>';
  } else if (value !== '' && value.indexOf('€') !== -1) {
    return '<span data-toggle="tooltip" title="' + value + '">' + (value.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</span>';
  } else if (value === '' && row.price_sqmt !== '') {
    if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
      return '<span data-toggle="tooltip" title="' + row.price_sqmt + '">' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</span>';
    } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
      return '<span data-toggle="tooltip" title="' + row.price_sqmt + '">' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</span>';
    } else if (row.price_sqmt !== '') {
      return '<span data-toggle="tooltip" title="' + row.price_sqmt + '&nbsp;{{ site.data.lang-uk.re_uah }}">' + (row.price_sqmt*1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</span>';
    }
  } else {
    return '<span data-toggle="tooltip" title="' + value + '&nbsp;{{ site.data.lang-uk.re_uah }}">' + (value*1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</span>';
  }
}

function priceSorter(a, b) {
  let s = /[$€₴]/g;
  var aa = a.replace(s, '');
  var bb = b.replace(s, '');
  return aa - bb
}
