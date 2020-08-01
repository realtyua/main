
function propertyFormatter(value, row) {
  return 'Продається <span class="text-lowercase"><strong>' + row.type + '</strong></span>, площею <strong>' + row.surface + '</strong> м², кімнат <strong>' + row.rooms + '</strong>, знаходиться у <strong>' + row.location + '</strong> за адресою <strong>' + row.address + '</strong>.';
}

function propertyDetailFormatter(value, row) {

    const images = Object.values(row.images || {})

    let html = [
        '<span class="row mx-0">',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Площа землі</strong>: ' + row.surface_land + ' м²</span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Поверх</strong>: ' + row.floor + ' у ' + row.floors + ' поверховому будинку</span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Вартість</strong>: ' + row.price_sqmt + ' за 1 м²</span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Стоя́нка</strong>: ' + row.parking + '</span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Доступна з</strong>: ' + row.date + '</span>',
        '<span class="col-12 col-sm-6 col-md-4"><strong>Продавець</strong>: <a href="tel:+' + row.phone + '" class="phone" title="' + row.seller + '">' + row.phone + '</a></span>',
        '</span>',
    ]

    if (images.length) {
        html.push('<hr><span class="row mx-0">')
        html.push(images.map(function (image) {
            return '<span class="col-6 col-sm-6 col-md-3"><a href="images/' + row.phone + '/' + image + '" class="lightbox" rel="lightbox-group-' + row.phone + '"><img src="images/' + row.phone + '/' + image + '" alt="realestate" class="img-thumbnail"></a></span>'
        }).join(''))
        html.push('</span>')
    }

    return html.join('')
}

function priceSorter(a, b) {
  var aa = a.replace('$', '')
  var bb = b.replace('$', '')
  return aa - bb
}
