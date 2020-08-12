---
layout: null
---

function detailFormatter(index, row) {
  var html = []
  $.each(row, function (key, value) {
    if (!key.startsWith('_') && value !== '') {
      if (key === 'images') {
        html.push('<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">' + value + '</span>')
      } else {
        html.push('<span class="col-12 col-sm-6 col-md-4"><b>' + key + ':</b> ' + value + '</span>')
      }
    }
  })
  return html.join('')
}

$(function() {
  var month = ["{{ site.data.lang-uk.m_01 }}", "{{ site.data.lang-uk.m_02 }}", "{{ site.data.lang-uk.m_03 }}", "{{ site.data.lang-uk.m_04 }}", "{{ site.data.lang-uk.m_05 }}", "{{ site.data.lang-uk.m_06 }}", "{{ site.data.lang-uk.m_07 }}", "{{ site.data.lang-uk.m_08 }}", "{{ site.data.lang-uk.m_09 }}", "{{ site.data.lang-uk.m_10 }}", "{{ site.data.lang-uk.m_11 }}", "{{ site.data.lang-uk.m_12 }}"];
  var usd = {{ site.usd }};
  var eur = {{ site.eur }};
  var expandedRow = null;
  var items = [];
  $('table').on('expand-row.bs.table', function (event, index, row, $detail) {

    var images = [];

    $(row.images).find('.col a').each(function () {
      images.push($(this).attr('href'))
    })

    if (expandedRow !== index) {
     	$('table').bootstrapTable('collapseRow', expandedRow)
    }
    expandedRow = index;

    var html = [];
    //const images = Object.values(row.images || {});

    $.each(row, function (index, key, value) {
      if (key.indexOf('_') && key !== 'images' || key !== 'id' && value !== '') {
        if (row.type.indexOf('Земля') !== -1 || row.type.indexOf('земля') !== -1) {
          html = [
            '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">',
            '<span class="col px-1"><dl><dt>Площа землі</dt><dd>' + row.surface_land + ' м<sup>2</sup></dd></dl></span>',
          ]
          if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
            html.push('<span class="col px-1"><dl><dt>Вартість землі за 1 м<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
          } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
            html.push('<span class="col px-1"><dl><dt>Вартість землі за 1 м<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
          } else {
            html.push('<span class="col px-1"><dl><dt>Вартість землі за 1 м<sup>2</sup></dt><dd>' + row.price_sqmt.toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
          }
          if (row.date !== '') {
            var d = new Date(row.date);
            var n = d.getMonth();
            html.push('<span class="col px-1"><dl><dt>Нерухомість доступна з</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>'),
            html.push('<span class="col px-1"><dl><dt>Продавець</dt><dd>' + row.seller + '</dd></dl></span>'),
            html.push('<span class="col px-1"><dl><dt>Контакти продавця</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
            html.push('</span>')
          }
        } else {
          html = [
            '<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">',
          ]
          if (row.surface_land !== '') {
            html.push('<span class="col px-1"><dl><dt>Площа землі</dt><dd>' + row.surface_land + ' м<sup>2</sup></dd></dl></span>')
          }
          if (row.floor !== '' && row.floors !== '') {
            html.push('<span class="col px-1"><dl><dt>Поверх</dt><dd>' + row.floor + ' у ' + row.floors + ' поверховому будинку</dd></dl></span>')
          }
          if (row.price_sqmt !== '' && row.price_sqmt.indexOf('$') !== -1) {
            html.push('<span class="col px-1"><dl><dt>Вартість нерухомості за 1 м<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
          } else if (row.price_sqmt !== '' && row.price_sqmt.indexOf('€') !== -1) {
            html.push('<span class="col px-1"><dl><dt>Вартість нерухомості за 1 м<sup>2</sup></dt><dd>' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
          } else {
            html.push('<span class="col px-1"><dl><dt>Вартість нерухомості за 1 м<sup>2</sup></dt><dd>' + row.price_sqmt.toFixed(0) + ' {{ site.data.lang-uk.re_uah }}</dd></dl></span>')
          }
          if (row.parking !== '') {
            html.push('<span class="col px-1"><dl><dt>Стоя́нка</dt><dd>' + row.parking + '</dd></dl></span>')
          }
          if (row.date !== '') {
            var d = new Date(row.date);
            var n = d.getMonth();
            html.push('<span class="col px-1"><dl><dt>Нерухомість доступна з</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>')
          }
          if (row.phone !== '') {
            html.push('<span class="col px-1"><dl><dt>Продавець</dt><dd>' + row.seller + '</dd></dl></span>'),
            html.push('<span class="col px-1"><dl><dt>Контакти продавця</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a></dd></dl></span>'),
            html.push('</span>')
          }
        }
      }
    })

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
      var $link = $(this).find('a')
      items[index].push({
        src: $link.attr('href'),
        w: $link.data('lightbox-width'),
        h: $link.data('lightbox-height')
      })
    })

	});

  $('table').on('click', '.lightbox', function(event){
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

  $('table').on('click-row.bs.table', function (e, row, $element) {
    $($element).siblings().removeClass('active');
    $($element).addClass('active');
  })

})

function propertyFormatter(value, row) {
  if (value === 'Земля') {
    return 'Продається <span class="text-lowercase"><strong>' + row.type + '</strong></span>, площею <strong>' + row.surface_land + '</strong> м<sup>2</sup>, знаходиться у <strong>' + row.location + '</strong> за адресою <strong>' + row.address + '</strong>.';
  } else {
    return 'Продається <span class="text-lowercase"><strong>' + row.type + '</strong></span>, площею <strong>' + row.surface + '</strong> м<sup>2</sup>, кімнат <strong>' + row.rooms + '</strong>, знаходиться у <strong>' + row.location + '</strong> за адресою <strong>' + row.address + '</strong>.';
  }
}

function priceFormatter(value) {
  var usd = {{ site.usd }};
  var eur = {{ site.eur }};
  if (value.indexOf('$') !== -1) {
    return '<span data-toggle="tooltip" title="' + value + '">' + (value.replace('$','') * usd).toFixed(0) + '</span> {{ site.data.lang-uk.re_uah }}';
  } else if (value.indexOf('€') !== -1) {
    return '<span data-toggle="tooltip" title="' + value + '">' + (value.replace('€','') * eur).toFixed(0) + '</span> {{ site.data.lang-uk.re_uah }}';
  } else {
    return value.toFixed(0) + ' {{ site.data.lang-uk.re_uah }}';
  }
}

function htmlPropertyFormatter(value, row) {
  if (value === 'Земля') {
    return 'Продається <span class="text-lowercase"><strong>' + row.type + '</strong></span>, площею <strong>' + row.surface_land + '</strong> м<sup>2</sup>, знаходиться у <strong>' + row.location + '</strong> за адресою <strong>' + row.address + '</strong>.';
  } else {
    return 'Продається <span class="text-lowercase"><strong>' + row.type + '</strong></span>, площею <strong>' + row.surface + '</strong> м<sup>2</sup>, кімнат <strong>' + row.rooms + '</strong>, знаходиться у <strong>' + row.location + '</strong> за адресою <strong>' + row.address + '</strong>.';
  }
}

function priceSorter(a, b) {
  var aa = a.replace('$', '')
  var bb = b.replace('$', '')
  return aa - bb
}
