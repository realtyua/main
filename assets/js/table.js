---
layout: null
---

$(function () {

    "use strict";

    var expandedRow = null;

    $('table').on('expand-row.bs.table', function (event, index) {
        if (expandedRow !== index) {
            $('table').bootstrapTable('collapseRow', expandedRow);
        }
        expandedRow = index;
    });

    $('table').on('click-row.bs.table', function (e, row, $element) {
        $($element).siblings().removeClass('active');
        $($element).addClass('active');
    });

});

var month = ["{{ site.data.lang-uk.m_01 }}", "{{ site.data.lang-uk.m_02 }}", "{{ site.data.lang-uk.m_03 }}", "{{ site.data.lang-uk.m_04 }}", "{{ site.data.lang-uk.m_05 }}", "{{ site.data.lang-uk.m_06 }}", "{{ site.data.lang-uk.m_07 }}", "{{ site.data.lang-uk.m_08 }}", "{{ site.data.lang-uk.m_09 }}", "{{ site.data.lang-uk.m_10 }}", "{{ site.data.lang-uk.m_11 }}", "{{ site.data.lang-uk.m_12 }}"];
var usd = {{ site.usd }};
var eur = {{ site.eur }};
var items = [];

function jsDetailFormatter(index, row, $detail) {

  "use strict";

  var html = [];

  $.each(row, function (key, value) {
    if (key !== 'images' || key !== 'id' && value !== '') {
      if (row.type.indexOf('{{ site.data.lang-uk.re_land }}') !== -1 || row.type.indexOf('{{ site.data.lang-uk.re_land | downcase }}') !== -1) {
        html = [
          '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">',
          '<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_surface_land }}</dt><dd>' + row.surface_land + ' {{ site.data.lang-uk.re_m }}<sup>2</sup></dd></dl></span>',
        ]
        if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + row.price_sqmt.toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        }
        if (row.date !== '') {
          var d = new Date(row.date);
          var n = d.getMonth();
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_date }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_seller }}</dt><dd>' + row.seller + '</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_phone }}</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
          html.push('</span>')
        }
      } else if (row.rent && row.rent !== '' && row.rent === '1') {
        html = [
          '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">'
        ]
        if (row.floor !== '' && row.floors !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_floor }}</dt><dd>' + row.floor + ' {{ site.data.lang-uk.re_at }} ' + row.floors + ' {{ site.data.lang-uk.re_floors }}</dd></dl></span>')
        }
        if (row.parking !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_parking }}</dt><dd>' + row.parking + '</dd></dl></span>')
        }
        if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + row.price_sqmt.toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        }
        if (row.date !== '') {
          var d = new Date(row.date);
          var n = d.getMonth();
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_dater }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_sellerr }}</dt><dd>' + row.seller + '</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_phoner }}</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
          html.push('</span>')
        }
      } else {
        html = [
          '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">',
        ]
        if (row.surface_land !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_surface_land }}</dt><dd>' + row.surface_land + ' {{ site.data.lang-uk.re_m }}<sup>2</sup></dd></dl></span>')
        }
        if (row.floor !== '' && row.floors !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_floor }}</dt><dd>' + row.floor + ' {{ site.data.lang-uk.re_at }} ' + row.floors + ' {{ site.data.lang-uk.re_floors }}</dd></dl></span>')
        }
        if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + row.price_sqmt.toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        }
        if (row.parking !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_parking }}</dt><dd>' + row.parking + '</dd></dl></span>')
        }
        if (row.date !== '') {
          var d = new Date(row.date);
          var n = d.getMonth();
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_date }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>')
        }
        if (row.phone !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_seller }}</dt><dd>' + row.seller + '</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_phone }}</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
          html.push('</span>')
        }
      }
    }
  })

  const images = Object.values(row.images || {});

  if (images.length) {
    html.push('<hr><span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">'),
    html.push(images.map(function (image) {
      return '<figure class="col px-1"><a href="/assets/images/' + row.phone + '/' + row.id + '/' + image.src + '" class="lightbox" title="Title Image Realestate" data-lightbox-width="1024" data-lightbox-height="768" data-lightbox-group="re-' + row.id + '4' + row.phone + '"><img src="/assets/images/' + row.phone + '/' + row.id + '/' + image.src + '" title="Title Image Realestate" alt="Alt Image Realestate" class="img-fluid img-thumbnail"></a></figure>'
    }).join('')),
    html.push('</span>')
  }

  $detail.html(html.join(''))

  items[index] = [];

  $detail.find('figure').each(function(){
    var $link = $(this).find('a');
    items[index].push({
        src: $link.attr('href'),
        w: $link.data('lightbox-width'),
        h: $link.data('lightbox-height')
    })
  })

}

function htmlDetailFormatter(index, row, $detail) {

  "use strict";

  var html = [];

  var images = [];

  $(row.images).find('.col a').each(function () {
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
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + row.price_sqmt.toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        }
        if (row.date !== '') {
          var d = new Date(row.date);
          var n = d.getMonth();
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_date }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_seller }}</dt><dd>' + row.seller + '</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_phone }}</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
          html.push('</span>')
        }
      } else if (row.rent && row.rent !== '' && row.rent === '1') {
        html = [
          '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">'
        ]
        if (row.floor !== '' && row.floors !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_floor }}</dt><dd>' + row.floor + ' {{ site.data.lang-uk.re_at }} ' + row.floors + ' {{ site.data.lang-uk.re_floors }}</dd></dl></span>')
        }
        if (row.parking !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_parking }}</dt><dd>' + row.parking + '</dd></dl></span>')
        }
        if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + row.price_sqmt.toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        }
        if (row.date !== '') {
          var d = new Date(row.date);
          var n = d.getMonth();
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_dater }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_sellerr }}</dt><dd>' + row.seller + '</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_phoner }}</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
          html.push('</span>')
        }
      } else {
        html = [
          '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">',
        ]
        if (row.surface_land !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_surface_land }}</dt><dd>' + row.surface_land + ' {{ site.data.lang-uk.re_m }}<sup>2</sup></dd></dl></span>')
        }
        if (row.floor !== '' && row.floors !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_floor }}</dt><dd>' + row.floor + ' {{ site.data.lang-uk.re_at }} ' + row.floors + ' {{ site.data.lang-uk.re_floors }}</dd></dl></span>')
        }
        if (row.parking !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_parking }}</dt><dd>' + row.parking + '</dd></dl></span>')
        }
        if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        } else if (row.price_sqmt !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.re_m }}<sup>2</sup></dt><dd>' + row.price_sqmt.toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
        }
        if (row.date !== '') {
          var d = new Date(row.date);
          var n = d.getMonth();
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_date }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>')
        }
        if (row.phone !== '') {
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_seller }}</dt><dd>' + row.seller + '</dd></dl></span>'),
          html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_phone }}</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
          html.push('</span>')
        }
      }
    }
  })

  if (images.length) {
    html.push('<hr><span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">'),
    html.push(images.map(function (image) {
      return '<figure class="col px-1"><a href="' + image + '" class="lightbox" title="Title Image Realestate" data-lightbox-width="1024" data-lightbox-height="768" data-lightbox-group="re-' + row.id + '4' + row.phone + '"><img src="' + image + '" title="Title Image Realestate" alt="Alt Image Realestate" class="img-fluid img-thumbnail"></a></figure>'
    }).join('')),
    html.push('</span>')
  }

  $detail.html(html.join(''))

  items[index] = [];

  $detail.find('figure').each(function(){
    var $link = $(this).find('a');
    items[index].push({
        src: $link.attr('href'),
        w: $link.data('lightbox-width'),
        h: $link.data('lightbox-height')
    })
  })

}

$(document).on('click', '.lightbox', function(event){
  event.preventDefault();
  var $pswp = $('.pswp')[0];
  options = {
    index: $(this).parent('figure').index(),
    bgOpacity: 0.85,
    showHideOpacity: true
  };
  var index = $(this).closest('.detail-view').prev().data('index');
  var gallery = new PhotoSwipe($pswp, PhotoSwipeUI_Default, items[index], options);
  gallery.init();
});

function propertyFormatter(value, row) {
  "use strict";
  if (value === '{{ site.data.lang-uk.re_land }}' || value === '{{ site.data.lang-uk.re_land | downcase }}') {
    return 'Продається <span class="text-lowercase"><strong>' + row.type + '</strong></span>, площею <strong>' + row.surface_land + '</strong> м<sup>2</sup>, знаходиться у <strong>' + row.location + '</strong> за адресою <strong>' + row.address + '</strong>.';
  } else if (row.rent && row.rent !== '' && row.rent === '1') {
    return 'Здається в оренду <span class="text-lowercase"><strong>' + row.type + '</strong></span>, площею <strong>' + row.surface + '</strong> м<sup>2</sup>, кімнат <strong>' + row.rooms + '</strong>, знаходиться у <strong>' + row.location + '</strong> за адресою <strong>' + row.address + '</strong>.';
  } else {
    return 'Продається <span class="text-lowercase"><strong>' + row.type + '</strong></span>, площею <strong>' + row.surface + '</strong> м<sup>2</sup>, кімнат <strong>' + row.rooms + '</strong>, знаходиться у <strong>' + row.location + '</strong> за адресою <strong>' + row.address + '</strong>.';
  }
}

function priceFormatter(value) {
  "use strict";
  if (value.indexOf('$') !== -1) {
    return '<span data-toggle="tooltip" title="' + value + '">' + (value.replace('$','') * usd).toFixed(0) + '</span> {{ site.data.lang-uk.re_uah }}';
  } else if (value.indexOf('€') !== -1) {
    return '<span data-toggle="tooltip" title="' + value + '">' + (value.replace('€','') * eur).toFixed(0) + '</span> {{ site.data.lang-uk.re_uah }}';
  } else {
    return value.toFixed(0) + ' {{ site.data.lang-uk.re_uah }}';
  }
}

function priceSorter(a, b) {
  "use strict";
  var aa = a.replace('$', '')
  var bb = b.replace('$', '')
  return aa - bb
}
