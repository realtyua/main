
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
  $('table').on('expand-row.bs.table', function (event, index) {
    if (expandedRow !== index) {
     	$('table').bootstrapTable('collapseRow', expandedRow)
    }
    expandedRow = index;
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

function htmlPropertyFormatter(value, row) {
  if (value === 'Земля') {
    return 'Продається <span class="text-lowercase"><strong>' + row.type + '</strong></span>, площею <strong>' + row.surface_land + '</strong> м<sup>2</sup>, знаходиться у <strong>' + row.location + '</strong> за адресою <strong>' + row.address + '</strong>.';
  } else {
    return 'Продається <span class="text-lowercase"><strong>' + row.type + '</strong></span>, площею <strong>' + row.surface + '</strong> м<sup>2</sup>, кімнат <strong>' + row.rooms + '</strong>, знаходиться у <strong>' + row.location + '</strong> за адресою <strong>' + row.address + '</strong>.';
  }
}

function propertyDetailFormatter(value, row) {

    const images = Object.values(row.images || {})

    let html = [
        '<span class="row mx-0">',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Площа землі</strong>: ' + row.surface_land + ' м<sup>2</sup></span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Поверх</strong>: ' + row.floor + ' у ' + row.floors + ' поверховому будинку</span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Вартість</strong>: ' + row.price_sqmt + ' за 1 м<sup>2</sup></span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Стоя́нка</strong>: ' + row.parking + '</span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Доступна з</strong>: ' + row.date + '</span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Продавець</strong>: <a href="tel:+' + row.phone + '" class="phone" title="' + row.seller + '">' + row.phone + '</a></span>',
        '</span>',
    ]


    if (images.length) {
        html.push('<hr><span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1 gallery re' + row.id + '">')
        html.push(images.map(function (image) {
            return '<span class="col px-1"><a href="/assets/images/' + row.phone + '/' + row.id + '/' + image.src + '" class="lightbox" title="Title Image Realestate" data-lightbox-width="1024" data-lightbox-height="768" data-lightbox-group="re-' + row.id + '4' + row.phone + '"><img src="/assets/images/' + row.phone + '/' + row.id + '/' + image.src + '" title="Title Image Realestate" alt="Alt Image Realestate" class="img-fluid img-thumbnail"></a></span>'
        }).join(''))
        html.push('</span>')
    }

    return html.join('')
}

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
