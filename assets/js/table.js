
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
  var expandedRow = null;
  var items = [];
  $('table').on('expand-row.bs.table', function (event, index, row, $detail) {
    if (expandedRow !== index) {
     	$('table').bootstrapTable('collapseRow', expandedRow)
    }
    expandedRow = index;

    var html = [];
    const images = Object.values(row.images || {})

    $.each(row, function (key, value) {
      if (!key.startsWith('_') && key !== 'images' || key !== 'id' && value !== '') {
        if (value === 'Земля' || value === 'земля') {
          html.push('<span class="col-12 col-sm-6 col-md-4"><strong>Вартість за 1 м<sup>2</sup>:</strong> ' + row.surface_land + '</span>')
          html.push('<span class="col-12 col-sm-6 col-md-4"><strong>Продавець</strong>: ' + row.seller + '</span>')
        } else {
          if (key === 'floor') {
            html.push('<span class="col-12 col-sm-6 col-md-4"><strong>Поверх:</strong> ' + row.floor + ' у ' + row.floors + ' поверховому будинку</span>')
          } else if (key === 'surface_land' && value !== '') {
            html.push('<span class="col-12 col-sm-6 col-md-4"><strong>Площа землі</strong>: ' + row.surface_land + ' м<sup>2</sup></span>')
          }
        }
      }
    })

    if (images.length) {
      html.push('<hr><span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">')
      html.push(images.map(function (image) {
        return '<figure class="col px-1"><a href="/assets/images/' + row.phone + '/' + row.id + '/' + image.src + '" class="lightbox" title="Title Image Realestate" data-lightbox-width="1024" data-lightbox-height="768" data-lightbox-group="re-' + row.id + '4' + row.phone + '"><img src="/assets/images/' + row.phone + '/' + row.id + '/' + image.src + '" title="Title Image Realestate" alt="Alt Image Realestate" class="img-fluid img-thumbnail"></a></figure>'
      }).join(''))
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

function priceFormatter(value, row) {
  const usd = 28.5;
  const eur = 32.5;
  if (!value.startsWith('$') && value !== '') {
    let price = value * usd;
    return price;
  } else if (!value.startsWith('€') && value !== '') {
    let price = value * usd;
    return price;
  } else {
    return value;
  }
}

function htmlPropertyFormatter(value, row) {
  if (value === 'Земля') {
    return 'Продається <span class="text-lowercase"><strong>' + row.type + '</strong></span>, площею <strong>' + row.surface_land + '</strong> м<sup>2</sup>, знаходиться у <strong>' + row.location + '</strong> за адресою <strong>' + row.address + '</strong>.';
  } else {
    return 'Продається <span class="text-lowercase"><strong>' + row.type + '</strong></span>, площею <strong>' + row.surface + '</strong> м<sup>2</sup>, кімнат <strong>' + row.rooms + '</strong>, знаходиться у <strong>' + row.location + '</strong> за адресою <strong>' + row.address + '</strong>.';
  }
}

// function propertyDetailFormatter(value, row) {
//
//     const images = Object.values(row.images || {})
//
//     let html = [
//         '<span class="row mx-0">',
//         '<span class="col-12 col-sm-6 col-md-4"><strong>Площа землі</strong>: ' + row.surface_land + ' м<sup>2</sup></span>',
//         '<span class="col-12 col-sm-6 col-md-4"><strong>Поверх</strong>: ' + row.floor + ' у ' + row.floors + ' поверховому будинку</span>',
//         '<span class="col-12 col-sm-6 col-md-4"><strong>Вартість</strong>: ' + row.price_sqmt + ' за 1 м<sup>2</sup></span>',
//         '<span class="col-12 col-sm-6 col-md-4"><strong>Стоя́нка</strong>: ' + row.parking + '</span>',
//         '<span class="col-12 col-sm-6 col-md-4"><strong>Доступна з</strong>: ' + row.date + '</span>',
//         '<span class="col-12 col-sm-6 col-md-4"><strong>Продавець</strong>: <a href="tel:+' + row.phone + '" class="phone" title="' + row.seller + '">' + row.phone + '</a></span>',
//         '</span>',
//     ]
//
//
//     if (images.length) {
//         html.push('<hr><span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1 gallery re' + row.id + '">')
//         html.push(images.map(function (image) {
//             return '<span class="col px-1"><a href="/assets/images/' + row.phone + '/' + row.id + '/' + image.src + '" class="lightbox" title="Title Image Realestate" data-lightbox-width="1024" data-lightbox-height="768" data-lightbox-group="re-' + row.id + '4' + row.phone + '"><img src="/assets/images/' + row.phone + '/' + row.id + '/' + image.src + '" title="Title Image Realestate" alt="Alt Image Realestate" class="img-fluid img-thumbnail"></a></span>'
//         }).join(''))
//         html.push('</span>')
//     }
//
//     return html.join('')
// }

function htmlDetailFormatter(value, row) {

  $.each(row, function (key, value) {
    if (!key.startsWith('_') && value !== '') {
      html = [
        '<span class="row mx-0">',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Площа землі</strong>: ' + row.surface_land + ' м<sup>2</sup></span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Поверх</strong>: ' + row.floor + ' у ' + row.floors + ' поверховому будинку</span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Вартість</strong>: ' + row.price_sqmt + ' за 1 м<sup>2</sup></span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Стоя́нка</strong>: ' + row.parking + '</span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Доступна з</strong>: ' + row.date + '</span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Продавець</strong>: <a href="tel:+' + row.phone + '" class="phone" title="' + row.seller + '">' + row.phone + '</a></span>',
        '</span>',
      ]
    }
  })

  return html.join('')

}

function priceSorter(a, b) {
  var aa = a.replace('$', '')
  var bb = b.replace('$', '')
  return aa - bb
}
