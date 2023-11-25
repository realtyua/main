
$(function () {
  "use strict";
  var $tabpro = $('table#property');
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop)
  });
  let value = params.id;
  if (value && value !== '') {
    if (value.split('').length === 12) {
      $tabpro.bootstrapTable('filterBy', { phone: value });
    } else {
      $tabpro.bootstrapTable('filterBy', { id: value });
      if ($('table[data-detail-formatter="htmlDetailFormatter"]').length === 1) {
        $tabpro.bootstrapTable('toggleDetailView', 0);
        $('tbody tr[data-index="0"]').addClass('active');
      } else {
        $tabpro.on('post-body.bs.table', function () {
          $tabpro.bootstrapTable('toggleDetailView', 0);
          $('tbody tr[data-index="0"]').addClass('active');
        })
      }
      $('div[class="row justify-content-between"]').remove();
      $('div.fixed-table-pagination').remove();
      $('div[class="fixed-table-toolbar"]').replaceWith('<div class="float-right btn-group"><a class="my-2" href="' + location.protocol + '//' + location.host + location.pathname + '">' + 'Переглянути інші пропозиції' + '</a></div>');
      $('h2[class="h3"]').remove();
    }
  }
  var expandedRow = null;
  if ($('div.pswp').length < 1 && $tabpro.length > 0) {
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
                          <button class="pswp__button pswp__button--close" title="Закрити (вийти)"></button>\
                          <button class="pswp__button pswp__button--share" title="Поділитись"></button>\
                          <button class="pswp__button pswp__button--fs" title="Перемкнути повноекранний режим"></button>\
                          <button class="pswp__button pswp__button--zoom" title="Збільшити/Зменшити"></button>\
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
                      <button class="pswp__button pswp__button--arrow--left" title="Попередній (стрілка ліворуч)"></button>\
                      <button class="pswp__button pswp__button--arrow--right" title="Наступний (стрілка праворуч)"></button>\
                      <div class="pswp__caption">\
                          <div class="pswp__caption__center"></div>\
                      </div>\
                  </div>\
              </div>\
          </div>';
      $('body').append(photoswipeTemplate);
  }
  $tabpro.on('expand-row.bs.table', function (event, index) { if (expandedRow !== index) { $('table').bootstrapTable('collapseRow', expandedRow); } expandedRow = index; });
  $tabpro.on('click-row.bs.table', function (e, row, $element) { $($element).siblings().removeClass('active'); $($element).addClass('active'); });
  $("select#data").change(function(){$tabpro.bootstrapTable("refresh",{url:"data/"+$(this).val()+".json"})});
});

var month = ["{{ site.data.lang-uk.m_01 }}","{{ site.data.lang-uk.m_02 }}","{{ site.data.lang-uk.m_03 }}","{{ site.data.lang-uk.m_04 }}","{{ site.data.lang-uk.m_05 }}","{{ site.data.lang-uk.m_06 }}","{{ site.data.lang-uk.m_07 }}","{{ site.data.lang-uk.m_08 }}","{{ site.data.lang-uk.m_09 }}","{{ site.data.lang-uk.m_10 }}","{{ site.data.lang-uk.m_11 }}","{{ site.data.lang-uk.m_12 }}"], usd = {{ site.usd }}, eur = {{ site.eur }}, nbu = {{ site.nbu }}, items = [], html = [];

function jsDetailFormatter(index, row, $detail) {
  "use strict";
  var reKvartyra = (row.type.includes('{{ site.data.lang-uk.re_kvartyru }}')) ? "{{ site.data.lang-uk.re_apartment }}" : row.type;
  var reSelleOrSeller = (row.rent == 1) ? "{{ site.data.lang-uk.re_sellerr }}" : "{{ site.data.lang-uk.re_seller }}";
  var rePhoneOrPhoner = (row.rent == 1) ? "{{ site.data.lang-uk.re_phoner }}" : "{{ site.data.lang-uk.re_phone }}";
  var cd = new Date();
	var cn = cd.getMonth();
	var d = new Date(row.date);
	var n = d.getMonth();
  var frY = (row.floor !== '') ? row.floor + '-й' : '';
  var flX = function() { if (row.floors == 1) { return row.floors + '-но'; } else if (row.floors < 5) { return row.floors + '-х'; } else if (row.floors == 7 || row.floors == 8) { return row.floors + '-ми'; } else { return row.floors + '-ти'; } };

  var reHeader = function() {
		html = ['<span class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">',]
		if (row.coordinates && row.coordinates !== '') {
      html.push('<span class="col px-1"><dl><dt>' + reKvartyra + ' {{ site.data.lang-uk.re_on_map }}</dt><dd><a class="marker" data-coord="' + row.coordinates + '" data-toggle="modal" data-target="#reMap" href="#reMap" aria-haspopup="true" aria-expanded="false">{{ site.data.lang-uk.re_show_map }}</a></dd></dl></span>')
    }
    if (row.type.includes('{{ site.data.lang-uk.re_land }}') || row.type.includes('{{ site.data.lang-uk.re_land | downcase }}')) {
  	} else if (row.surface_land !== '') {
  		html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_surface_land }}</dt><dd>' + row.surface_land + ' {{ site.data.lang-uk.m }} (' + (row.surface_land / 10000) + ' га)</dd></dl></span>')
  	}
    if (row.floor == '' && row.floors == '') {
		} else if (row.floor == '' && row.floors !== '' && row.floors == 1 && (row.type.includes('{{ site.data.lang-uk.re_house }}') || row.type.includes('{{ site.data.lang-uk.re_house | downcase }}') || row.type.includes('{{ site.data.lang-uk.re_roomsp }}'))) {
			html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_floor }}</dt><dd>' + row.floors + '{{ site.data.lang-uk.re_fno }} {{ site.data.lang-uk.re_floorsh }}</dd></dl></span>')
		} else if (row.floor == '' && row.floors !== '' && row.floors > 1 && (row.type.includes('{{ site.data.lang-uk.re_house }}') || row.type.includes('{{ site.data.lang-uk.re_house | downcase }}') || row.type.includes('{{ site.data.lang-uk.re_roomsp }}'))) {
			html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_floor }}</dt><dd>' + row.floors + '{{ site.data.lang-uk.re_fx }} {{ site.data.lang-uk.re_floorsh }}</dd></dl></span>')
		} else {
			html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_floor }}</dt><dd>' + frY + ' {{ site.data.lang-uk.re_at }} ' + flX() + ' {{ site.data.lang-uk.re_floors }}</dd></dl></span>')
		}
		if (row.parking && row.parking !== '') { html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_parking }}</dt><dd>' + row.parking + '</dd></dl></span>') }
		if (row.object && row.object !== '') { html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_object }}</dt><dd>' + row.object + '</dd></dl></span>') }
	};

  var rePriceSqmt = function() {

    if (row.price !== '' && row.price_sqmt == '' && row.type.includes('{{ site.data.lang-uk.re_land }}') || row.type.includes('{{ site.data.lang-uk.re_land | downcase }}')) {

      if (row.price.includes('$')) {
      	html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.m_za }}</dt><dd>' + (row.price.replace('$', '') / row.surface_land * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
      } else if (row.price.includes('€')) {
      	html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.m_za }}</dt><dd>' + (row.price.replace('€', '') / row.surface_land * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
      } else if (row.price !== '') {
      	html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtl }} {{ site.data.lang-uk.m_za }}</dt><dd>' + (row.price / row.surface_land * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
      }

    } else if (row.price == '' && row.price_sqmt !== '' && row.rent && row.rent !== '' && row.rent == 1) {

      if (row.price_sqmt.includes('$')) {
      	html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt.replace('$', '') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
      } else if (row.price_sqmt.includes('€')) {
      	html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt.replace('€', '') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
      } else if (row.price_sqmt !== '') {
      	html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
      }

    } else if (row.price !== '' && row.price_sqmt == '' && row.rent && row.rent !== '' && row.rent == 1 && row.type.includes('{{ site.data.lang-uk.re_roomsp }}')) {

      if (row.price.includes('$')) {
      	html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_pricer | capitalize }}</dt><dd>' + (row.price.replace('$', '') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }} (' + (row.price.replace('$', '') / row.surface * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }} {{ site.data.lang-uk.m_za }})</dd></dl></span>')
      } else if (row.price.includes('€')) {
      	html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_pricer | capitalize }}</dt><dd>' + (row.price.replace('€', '') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }} (' + (row.price.replace('€', '') / row.surface * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }} {{ site.data.lang-uk.m_za }})</dd></dl></span>')
      } else if (row.price !== '') {
      	html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_pricer | capitalize }}</dt><dd>' + (row.price * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }} (' + (row.price / row.surface * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }} {{ site.data.lang-uk.m_za }})</dd></dl></span>')
      }

    } else if (row.price !== '' && row.price_sqmt == '' && row.rent && row.rent !== '' && row.rent == 1) {

      if (row.price.includes('$')) {
        html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_pricer | capitalize }}</dt><dd>' + (row.price.replace('$', '') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
      } else if (row.price.includes('€')) {
        html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_pricer | capitalize }}</dt><dd>' + (row.price.replace('€', '') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
      } else if (row.price !== '') {
        html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_pricer | capitalize }}</dt><dd>' + (row.price * 1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
      }

    } else {

      if (row.price.includes('$')) {
      	html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.m_za }}</dt><dd>' + (row.price.replace('$', '') / row.surface * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
      } else if (row.price.includes('€')) {
      	html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.m_za }}</dt><dd>' + (row.price.replace('€', '') / row.surface * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
      } else if (row.price !== '') {
      	html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_price_sqmt }} {{ site.data.lang-uk.m_za }}</dt><dd>' + (row.price * 1).toFixed(0) / row.surface + '&nbsp;{{ site.data.lang-uk.re_uah }}</dd></dl></span>')
      }

    }

  };

  var reFooter = function() {

    if (row.rent && row.rent !== '' && row.rent == 1) {

			if (row.date !== '' && d > cd) {
				html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_dater }}</dt><dd>' + cd.getDate() + '&nbsp;' + month[cn] + '&nbsp;' + cd.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>')
			} else {
				html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_dater }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>')
			}

		} else if (row.type.includes('{{ site.data.lang-uk.re_land }}') || row.type.includes('{{ site.data.lang-uk.re_land | downcase }}')) {

			if (row.date !== '' && d > cd) {
				html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_datel }}</dt><dd>' + cd.getDate() + '&nbsp;' + month[cn] + '&nbsp;' + cd.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>')
			} else {
				html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_datel }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>')
			}

		} else {

			if (row.date !== '' && d > cd) {
				html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_date }}</dt><dd>' + cd.getDate() + '&nbsp;' + month[cn] + '&nbsp;' + cd.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>')
			} else {
				html.push('<span class="col px-1"><dl><dt>{{ site.data.lang-uk.re_date }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.lang-uk.roku }}</dd></dl></span>')
			}

		}

    if (row.seller && row.seller !== '') {
			html.push('<span class="col px-1"><dl><dt>' + reSelleOrSeller + '</dt><dd><a href="{{ site.url }}/region/{{ site.region_slug }}/?id=' + row.phone + '" title="{{ site.data.lang-uk.offers }}">' + row.seller.replace('{{ site.data.lang-uk.re_seller }} ','') + '</a></dd></dl></span>'),
			html.push('<span class="col px-1"><dl><dt>' + rePhoneOrPhoner + '</dt><dd><a href="tel:+' + row.phone + '">+' + row.phone.substr(0, 2) + '&nbsp;' + row.phone.substr(2, 3) + '&nbsp;' + row.phone.substr(5, 3) + '&nbsp;' + row.phone.substr(8, 2) + '&nbsp;' + row.phone.substr(10, 2) + '</a><i class="d-none">' + row.id + '</i></dd></dl></span>'),
			html.push('</span>')
		}

    if (row.description && row.description !== '') {
      html.push('<span class="row mx-n1">'),
      html.push('<span class="col-12 px-1"><dl><dt>{{ site.data.lang-uk.re_description }}</dt><dd>' + row.description + '</dd></dl></span>'), html.push('</span>')
    }

  };

  $.each(row, function (key, value) {
    if (key !== 'images' || key !== 'id' && value !== '') {
      reHeader();
      rePriceSqmt();
      reFooter();
    }
  })

  const images = Object.values(row.images || {});

  if (images.length) {
    var region = row.region.replace('кий', 'кому');
    var district = region.replace('район', 'районі');
    html.push('<hr class="mt-0"><span class="row row-cols-1 row-cols-sm-2 row-cols-md-4 mx-n1">'),
    html.push(images.map(function (image) {
      return '<figure class="col px-1"><a href="/assets/images/' + row.phone + '/' + row.id + '/' + image.src + '" class="lightbox" title="' + image.title + '" data-lightbox-caption="{{ site.data.lang-uk.re_free_ads_in }} ' + row.location + '' + district + '" data-lightbox-width="1024" data-lightbox-height="768" data-lightbox-group="re-' + row.id + '4' + row.phone + '"><img src="/assets/images/' + row.phone + '/' + row.id + '/' + image.src + '" loading="lazy" title="' + image.title + '" alt="' + image.alt + '" class="img-fluid img-thumbnail" width="380" height="285" intrinsicsize="1024x768"></a></figure>'
    }).join('')),
    html.push('</span>')
  }

  $detail.html(html.join(''))

}

function propertyFormatter(value, row) {
  "use strict";
  var reProdayu = (row.type.includes('{{ site.data.lang-uk.re_kvartyru }}')) ? "{{ site.data.lang-uk.re_sale }}" : "{{ site.data.lang-uk.re_for_sale }}";
  var reRoomOrPrym = (row.type.includes('{{ site.data.lang-uk.re_roomsp }}')) ? "{{ site.data.lang-uk.re_roomsps }}" : "{{ site.data.lang-uk.re_rooms }}";
  if (value !== '') {
    if (row.type.includes('{{ site.data.lang-uk.re_land }}') || row.type.includes('{{ site.data.lang-uk.re_land | downcase }}')) {
      html = ['{{ site.data.lang-uk.re_for_sale }} <b class="text-lowercase">' + row.type + '</b>, ']
      if (row.surface_land && row.surface_land !== '') { html.push('{{ site.data.lang-uk.re_surface }} <b>' + row.surface_land + ' {{ site.data.lang-uk.re_m }}</b><sup>2</sup> (' + (row.surface_land / 10000) + ' га)') }
      if (row.location && row.location !== '') { html.push(', {{ site.data.lang-uk.re_location }} <b>{{ site.data.lang-uk.re_at }} ' + row.location + '</b>, ') }
      if (row.address && row.address !== '' && row.location !== '') { html.push('{{ site.data.lang-uk.re_address }} <b>' + row.address + '</b>') }
      if (row.address && row.address !== '' && row.location === '') { html.push(', {{ site.data.lang-uk.re_location }} {{ site.data.lang-uk.re_address }} <b>' + row.address + '</b>') }
      if (row.region && row.region !== '' && row.location === '') { html.push(', ' + row.region + '.') }
    } else if (row.rent !== '' && row.rent == 1 && row.price !== '') {
      html = ['{{ site.data.lang-uk.re_for_rent }} <b class="text-lowercase">' + row.type + '</b>, ']
      if (row.surface && row.surface !== '') { html.push('{{ site.data.lang-uk.re_surface }} <b>' + row.surface + ' {{ site.data.lang-uk.re_m }}</b><sup>2</sup>, ') }
      if (row.rooms && row.rooms !== '') { html.push(reRoomOrPrym + ' ' + row.rooms + ', ') }
      if (row.floor && row.floor !== '') { html.push('{{ site.data.lang-uk.re_na }} <b>' + row.floor + '</b>{{ site.data.lang-uk.re_mu }} {{ site.data.lang-uk.re_floorci }}, ') }
      if (row.floor == '' && row.floors !== '') { html.push('{{ site.data.lang-uk.re_at }} <b>' + row.floors + '</b> {{ site.data.lang-uk.re_floors }}, ') }
      if (row.location && row.location !== '') { html.push('{{ site.data.lang-uk.re_location }} {{ site.data.lang-uk.re_at }} <b>' + row.location + '</b>, {{ site.data.lang-uk.re_address }} <b>' + row.address + '</b>') }
      if (row.region && row.region !== '') { html.push('{{ site.data.lang-uk.re_address }} <b>' + row.address + '</b>, ' + row.region + '.') }
    } else if (row.rent !== '' && row.rent == 1 && row.price == '' && row.price_sqmt !== '') {
      html = ['{{ site.data.lang-uk.re_for_rentd }} <b class="text-lowercase">' + row.type + '</b>, ']
      if (row.surface && row.surface !== '') { html.push('{{ site.data.lang-uk.re_surface }} <b>' + row.surface + ' {{ site.data.lang-uk.re_m }}</b><sup>2</sup>, ') }
      if (row.rooms && row.rooms !== '') { html.push(reRoomOrPrym + ' ' + row.rooms + ', ') }
      if (row.floor && row.floor !== '') { html.push('{{ site.data.lang-uk.re_na }} <b>' + row.floor + '</b>{{ site.data.lang-uk.re_mu }} {{ site.data.lang-uk.re_floorci }}, ') }
      if (row.floor == '' && row.floors !== '') { html.push('{{ site.data.lang-uk.re_at }} <b>' + row.floors + '</b> {{ site.data.lang-uk.re_floors }}, ') }
      if (row.location && row.location !== '') { html.push('{{ site.data.lang-uk.re_location }} {{ site.data.lang-uk.re_at }} <b>' + row.location + '</b>, {{ site.data.lang-uk.re_address }} <b>' + row.address + '</b>.') }
      if (row.region && row.region !== '') { html.push('{{ site.data.lang-uk.re_address }} <b>' + row.address + '</b>, ' + row.region + '.') }
    } else {
      html = [reProdayu + ' <b class="text-lowercase">' + row.type + '</b>, ']
      if (row.surface && row.surface !== '') { html.push('{{ site.data.lang-uk.re_surface }} <b>' + row.surface + ' {{ site.data.lang-uk.re_m }}</b><sup>2</sup>, ') }
      if (row.rooms && row.rooms !== '') { html.push(reRoomOrPrym + ' ' + row.rooms + ', ') }
      if (row.type.includes('{{ site.data.lang-uk.re_house }}') || row.type.includes('{{ site.data.lang-uk.re_house | downcase }}')) {
        if (row.floors && row.floors !== '') { html.push('{{ site.data.lang-uk.re_floorss }} <b>' + row.floors + '</b>, ') }
      } else {
        if (row.floor && row.floor !== '') { html.push('{{ site.data.lang-uk.re_na }} <b>' + row.floor + '</b>{{ site.data.lang-uk.re_mu }} {{ site.data.lang-uk.re_floorci }}, ') }
      }
      if (row.region && row.region !== '' && row.region.includes('{{ site.data.lang-uk.district }}')) {
        if (row.region && row.region !== '') { html.push('{{ site.data.lang-uk.re_address }} <b>' + row.address + '</b>, ' + row.region + '.') }
        if (row.page && row.page == 1) { html.push(' <a href=/' + row.phone + '>{{ site.data.lang-uk.re_page_ads }}</a>.') }
      } else {
        if (row.location && row.location !== '') { html.push('{{ site.data.lang-uk.re_location }} {{ site.data.lang-uk.re_at }} <b>' + row.location + '</b>, {{ site.data.lang-uk.re_address }} <b>' + row.address + '</b>.') }
        if (row.page && row.page == 1) { html.push(' <a href="{{ site.url }}/' + row.phone + '" target="_blank">{{ site.data.lang-uk.re_page_ads }}</a>.') }
      }
    }
  }
  return html.join('')
}

function priceFormatter(value, row) {
  "use strict";
  if (value !== '' && value.includes('$')) {
    return '<span data-toggle="tooltip" title="' + value + '">' + (value.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</span>';
  } else if (value !== '' && value.includes('€')) {
    return '<span data-toggle="tooltip" title="' + value + '">' + (value.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</span>';
  } else if (value == '' && row.price_sqmt !== '') {
    if (row.price_sqmt !== '' && row.price_sqmt.includes('$')) {
      return '<span data-toggle="tooltip" title="' + row.price_sqmt + '">' + (row.price_sqmt.replace('$','') * usd).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</span>';
    } else if (row.price_sqmt !== '' && row.price_sqmt.includes('€')) {
      return '<span data-toggle="tooltip" title="' + row.price_sqmt + '">' + (row.price_sqmt.replace('€','') * eur).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</span>';
    } else if (row.price_sqmt !== '') {
      return '<span data-toggle="tooltip" title="$' + (row.price_sqmt / nbu).toFixed(0) + '">' + (row.price_sqmt*1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</span>';
    }
  } else {
    return '<span data-toggle="tooltip" title="$' + (value / nbu).toFixed(0) + '">' + (value*1).toFixed(0) + '&nbsp;{{ site.data.lang-uk.re_uah }}</span>';
  }
}

function priceSorter(a, b) {
  let s = /[$€₴]/g;
  var aa = a.replace(s, '');
  var bb = b.replace(s, '');
  return aa - bb
}
