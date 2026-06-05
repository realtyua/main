$(function () {
  "use strict";
  var $tabpro = $('table#property');

  var $btWrapper = $tabpro.closest('.bootstrap-table');
  var spinnerId = 'tbl-spinner';
  if ($btWrapper.length) {
    $btWrapper.after('<div id="' + spinnerId + '">' + blockLoader.spinner() + '</div>');
    $btWrapper.hide();
    var $filterSource = $('#filter-toolbar-source');
    if ($filterSource.length) {
      var $toolbar = $btWrapper.find('.fixed-table-toolbar');
      var $searchInput = $toolbar.find('.search-input').detach();
      $toolbar.find('.search').remove();
      $searchInput.removeClass('mb-2').addClass('form-control-sm');
      var $formRow = $filterSource.children();
      var $searchCol = $('<div class="col-md-auto form-group mb-0">');
      var $inputGroup = $('<div class="input-group mb-2">');
      $inputGroup.append($searchInput);
      $inputGroup.append('<div class="input-group-append"><button type="button" id="filterReset" class="btn btn-link btn-sm" title="Очистити фільтер">&#8634;</button></div>');
      $searchCol.append($inputGroup);
      $formRow.append($searchCol);
      $toolbar.html($filterSource.children());
      $filterSource.remove();
    }
  }

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: function(searchParams, prop) {
      return searchParams.get(prop);
    }
  });
  var value = params.id;
  if (value && value !== '') {
    if (value.split('').length === 12) {
      $tabpro.bootstrapTable('filterBy', { phone: value });
      $tabpro.on('load-success.bs.table', function(e, data) {
        var filtered = $tabpro.bootstrapTable('getData');
        if (filtered && filtered.length > 0) {
          var seller = filtered[0].seller.replace('{{ site.data.uk.re_seller }} ', '');
          $('h2.h3').text(seller + ' - всі оголошення про продаж та оренду нерухомості');
        }
      });
    } else {
      $tabpro.bootstrapTable('filterBy', { id: value });

      function handleIdFilterResult() {
        $('#' + spinnerId).remove();
        var data = $tabpro.bootstrapTable('getData');
        if (data && data.length > 0) {
          $tabpro.removeClass('d-none');
          $tabpro.closest('.bootstrap-table').show();
          $tabpro.bootstrapTable('toggleDetailView', 0);
          $('tbody tr[data-index="0"]').addClass('active');
          $('div.row.justify-content-between').remove();
          $('div.fixed-table-pagination').remove();
          $('div[class="fixed-table-toolbar"]').replaceWith('<div class="float-right btn-group"><a class="my-2" href="' + location.protocol + '//' + location.host + location.pathname + '">Переглянути інші пропозиції</a></div>');
          $('h2[class="h3"]').remove();
        } else {
          if ($tabpro.closest('.bootstrap-table').find('.alert').length) return;
          var $wrapper = $tabpro.closest('.bootstrap-table');
          if ($wrapper.length) {
            $wrapper.html(blockLoader.error('Такого запису не знайдено', location.protocol + '//' + location.host + location.pathname)).show();
          } else {
            $tabpro.replaceWith(blockLoader.error('Такого запису не знайдено', location.protocol + '//' + location.host + location.pathname));
          }
        }
      }

      if ($('table[data-detail-formatter="htmlDetailFormatter"]').length === 1) {
        handleIdFilterResult();
      } else {
        $tabpro.on('post-body.bs.table', handleIdFilterResult);
      }
    }
  }
  var expandedRow = null;
  if ($('div.pswp').length < 1 && $tabpro.length > 0) {
    var photoswipeTemplate = '<div class="pswp" tabindex="-1" role="dialog"><div class="pswp__bg"></div><div class="pswp__scroll-wrap"><div class="pswp__container"><div class="pswp__item"></div><div class="pswp__item"></div><div class="pswp__item"></div></div><div class="pswp__ui pswp__ui--hidden"><div class="pswp__top-bar"><div class="pswp__counter"></div><button class="pswp__button pswp__button--close" title="Закрити (вийти)"></button><button class="pswp__button pswp__button--share" title="Поділитись"></button><button class="pswp__button pswp__button--fs" title="Перемкнути повноекранний режим"></button><button class="pswp__button pswp__button--zoom" title="Збільшити/Зменшити"></button><div class="pswp__preloader"><div class="pswp__preloader__icn"><div class="pswp__preloader__cut"><div class="pswp__preloader__donut"></div></div></div></div></div><div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap"><div class="pswp__share-tooltip"></div></div><button class="pswp__button pswp__button--arrow--left" title="Попередній (стрілка ліворуч)"></button><button class="pswp__button pswp__button--arrow--right" title="Наступний (стрілка праворуч)"></button><div class="pswp__caption"><div class="pswp__caption__center"></div></div></div></div></div>';
    $('body').append(photoswipeTemplate);
  }
  $tabpro.on('expand-row.bs.table', function(event, index) {
    if (expandedRow !== index) {
      $('table').bootstrapTable('collapseRow', expandedRow);
    }
    expandedRow = index;
  });
  $tabpro.on('click-row.bs.table', function(e, row, $element) {
    $($element).siblings().removeClass('active');
    $($element).addClass('active');
  });
  if ($tabpro.data('url')) {
    $tabpro.on('load-success.bs.table', function(e, data) {
      $('#' + spinnerId).remove();
      $tabpro.removeClass('d-none');
      $tabpro.closest('.bootstrap-table').show();
      window.tableAllOriginalData = data;
      setTimeout(applyTableFilters, 100);
    });
    $tabpro.on('load-error.bs.table', function(e, status) {
      $('#' + spinnerId).remove();
      var msg = status === 404 ? 'Ой! Щось пішло не так, не вдалося завантажити дані' : 'Не вдалося завантажити дані';
      var $wrapper = $tabpro.closest('.bootstrap-table');
      $wrapper.html(blockLoader.error(msg)).show();
    });
  } else {
    $('#' + spinnerId).remove();
    $tabpro.removeClass('d-none');
    $tabpro.closest('.bootstrap-table').show();
  }

  function updateFilterVisibility() {
    var type = $("#data").val();
    var $filterRooms = $("#filterRooms").closest("div.col-md-auto");
    var $filterSurface = $("#filterSurface").closest("div.col-md-auto");
    var $filterFloor = $("#filterFloor").closest("div.col-md-auto");
    var $filterFloors = $("#filterFloors").closest("div.col-md-auto");
    var $filterAction = $("#filterAction").closest("div.col-md-auto");
    var $filterSurfaceLand = $("#filterSurfaceLand").closest("div.col-md-auto");
    var $filterSearch = $(".search-input").closest("div.col-md-auto");

    $filterRooms.addClass('d-none');
    $filterSurface.addClass('d-none');
    $filterFloor.addClass('d-none');
    $filterFloors.addClass('d-none');
    $filterAction.addClass('d-none');
    $filterSurfaceLand.addClass('d-none');
    $filterSearch.addClass('d-none');
    $("#filterAction").val("all");

    if (type === "all") {
    } else if (type === "apartment") {
      $filterAction.removeClass('d-none');
      $filterRooms.removeClass('d-none');
      $filterSurface.removeClass('d-none');
      $filterFloor.removeClass('d-none');
      $filterFloors.removeClass('d-none');
      $filterSearch.removeClass('d-none');
    } else if (type === "house") {
      $filterAction.removeClass('d-none');
      $filterRooms.removeClass('d-none');
      $filterSurface.removeClass('d-none');
      $filterFloors.removeClass('d-none');
      $filterSearch.removeClass('d-none');
    } else if (type === "commercial" || type === "garage") {
      $filterAction.removeClass('d-none');
      $filterSurface.removeClass('d-none');
      $filterSearch.removeClass('d-none');
    } else if (type === "land") {
      $filterAction.removeClass('d-none');
      $filterSurfaceLand.removeClass('d-none');
      $filterSearch.removeClass('d-none');
    }

    $("#filterRooms, #filterSurface, #filterFloor, #filterFloors, #filterSurfaceLand").val("");
  }

  updateFilterVisibility();

  $("#data").change(function() {
    updateFilterVisibility();
    $tabpro.bootstrapTable("refresh", { url: "data/" + $(this).val() + ".json" });
  });

  $('#filterReset').click(function() {
    $("#data").val("all");
    updateFilterVisibility();
    $tabpro.bootstrapTable("refresh", { url: "data/all.json" });
  });

  function applyTableFilters() {
    var data = window.tableAllOriginalData || $tabpro.bootstrapTable('getData');
    if (!data || !data.length) return;
    var $rooms = $("select#filterRooms");
    var $surface = $("select#filterSurface");
    var $surfaceLand = $("select#filterSurfaceLand");
    var $floor = $("select#filterFloor");
    var $floors = $("select#filterFloors");

    var filteredData = data.filter(function(row) {
      if ($rooms.val()) {
        var roomsVal = parseInt($rooms.val());
        var rowRooms = parseInt(row.rooms) || 0;
          if (roomsVal === 6) {
            if (rowRooms < 6) {
              return false;
            }
          } else {
            if (rowRooms !== roomsVal) {
              return false;
            }
          }
      }

      if ($surface.val()) {
        var surfVal = $surface.val();
        var range = surfVal.split('-');
        var type = $("#data").val();
        var rowSurf = type === "land" ? (parseFloat(row.surface_land) || 0) : (parseFloat(row.surface) || 0);
        if (range[0] === '') {
          if (rowSurf < parseFloat(range[1])) {
            return false;
          }
        } else if (range[1] === '') {
          if (rowSurf < parseFloat(range[0])) {
            return false;
          }
        } else {
          if (rowSurf < parseFloat(range[0]) || rowSurf >= parseFloat(range[1])) {
            return false;
          }
        }
      }

      if ($surfaceLand.val()) {
        var surfLandVal = $surfaceLand.val();
        var rangeLand = surfLandVal.split('-');
        var rowSurfLand = parseFloat(row.surface_land) || 0;
        if (rangeLand[0] === '') {
          if (rowSurfLand < parseFloat(rangeLand[1])) {
            return false;
          }
        } else if (rangeLand[1] === '') {
          if (rowSurfLand < parseFloat(rangeLand[0])) {
            return false;
          }
        } else {
          if (rowSurfLand < parseFloat(rangeLand[0]) || rowSurfLand >= parseFloat(rangeLand[1])) {
            return false;
          }
        }
      }

      if ($floor.val()) {
          var floorVal = $floor.val();
          if (floorVal.indexOf('-') === -1) {
            if (parseInt(row.floor) !== parseInt(floorVal)) return false;
          } else {
            var floorRange = floorVal.split('-');
            var rowFloor = parseInt(row.floor) || 0;
            if (floorRange[0] === '') {
              if (rowFloor < parseInt(floorRange[1])) return false;
            } else if (floorRange[1] === '') {
              if (rowFloor < parseInt(floorRange[0])) return false;
            } else {
              if (rowFloor < parseInt(floorRange[0]) || rowFloor >= parseInt(floorRange[1])) return false;
            }
          }
        }

        if ($floors.val()) {
          var floorsVal = $floors.val();
          if (floorsVal.indexOf('-') === -1) {
            if (parseInt(row.floors) !== parseInt(floorsVal)) return false;
          } else {
            var floorsRange = floorsVal.split('-');
            var rowFloors = parseInt(row.floors) || 0;
            if (floorsRange[0] === '') {
              if (rowFloors < parseInt(floorsRange[1])) return false;
            } else if (floorsRange[1] === '') {
              if (rowFloors < parseInt(floorsRange[0])) return false;
            } else {
              if (rowFloors < parseInt(floorsRange[0]) || rowFloors >= parseInt(floorsRange[1])) return false;
            }
          }
        }

      var action = $("#filterAction").val();
      if (action === "sale" && row.rent !== "") {
        return false;
      }
      if (action === "rent" && row.rent !== "1") {
        return false;
      }

      return true;
    });

    $tabpro.bootstrapTable('load', filteredData);
  }

  $("select#filterRooms, select#filterSurface, select#filterFloor, select#filterFloors, #filterAction, #filterSurfaceLand").change(function() {
    if (window.tableAllOriginalData && window.tableAllOriginalData.length > 0) {
      applyTableFilters();
    }
  });
  $('#property').on('post-body.bs.table', function() {
$('.page-link[href="javascript:void(0)"]').attr('href', '#');
$('.fixed-table-toolbar .search-input').each(function(i) {
  $(this).attr({ id: 'tableSearch' + (i + 1), name: 'tableSearch' });
});
$('.fixed-table-toolbar .search-input').each(function(i) {
  $(this).attr({ id: 'tableSearch' + (i + 1), name: 'tableSearch' });
});
  });
});

function drawCanvasText(canvas, fontSize, text, color) {
  var ctx = canvas.getContext('2d');
  var font = fontSize + 'px -apple-system, "Source Sans Pro", "Open Sans", sans-serif';
  ctx.font = font;
  canvas.width = Math.ceil(ctx.measureText(text).width);
  canvas.height = fontSize + 10;
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillText(text, 0, fontSize - 1);
}

function drawPlaceholder(canvas) {
  drawCanvasText(canvas, 16, '+38 XXX XXX XX XX', '#2d5ca6');
}

var month = [
  "{{ site.data.uk.m_01 }}", "{{ site.data.uk.m_02 }}", "{{ site.data.uk.m_03 }}", "{{ site.data.uk.m_04 }}",
  "{{ site.data.uk.m_05 }}", "{{ site.data.uk.m_06 }}", "{{ site.data.uk.m_07 }}", "{{ site.data.uk.m_08 }}",
  "{{ site.data.uk.m_09 }}", "{{ site.data.uk.m_10 }}", "{{ site.data.uk.m_11 }}", "{{ site.data.uk.m_12 }}"
], usd = {{ site.usd }}, eur = {{ site.eur }}, nbu = {{ site.nbu }}, items = [], html = [], isArchive = window.location.pathname.includes('/archive');

function jsDetailFormatter(index, row, $detail) {
  "use strict";
  var reKvartyra = (row.type.includes('{{ site.data.uk.re_kvartyru }}')) ? "{{ site.data.uk.re_apartment }}" : row.type;
  var reSelleOrSeller = (row.rent == 1) ? "{{ site.data.uk.re_sellerr }}" : "{{ site.data.uk.re_seller }}";
  var rePhoneOrPhoner = (row.rent == 1) ? "{{ site.data.uk.re_phoner }}" : "{{ site.data.uk.re_phone }}";
  var d = new Date(row.date);
  var n = d.getMonth();
  var frY = (row.floor !== '') ? row.floor + '-й' : '';
  var flX = function() {
    if (row.floors == 1) {
      return row.floors + '-но';
    } else if (row.floors < 5) {
      return row.floors + '-х';
    } else if (row.floors == 7 || row.floors == 8) {
      return row.floors + '-ми';
    } else {
      return row.floors + '-ти';
    }
  };

  var reHeader = function() {
    html = ['<div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 mx-n1">'];
    if (row.coordinates && row.coordinates !== '') {
      html.push('<div class="col px-1"><dl><dt>' + reKvartyra + ' {{ site.data.uk.re_on_map }}</dt><dd><a class="marker" data-coord="' + row.coordinates + '" data-toggle="modal" data-target="#mapa" href="#mapa" aria-haspopup="true" aria-expanded="false">{{ site.data.uk.re_show_map }}</a></dd></dl></div>');
    }
    if (row.type.includes('{{ site.data.uk.re_land }}') || row.type.includes('{{ site.data.uk.re_land | downcase }}')) {
    } else if (row.surface_land !== '') {
      html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_surface_land }}</dt><dd>' + row.surface_land + ' {{ site.data.uk.m }} (' + (row.surface_land / 10000) + ' га)</dd></dl></div>');
    }
    if (row.floor == '' && row.floors == '') {
    } else if (row.floor == '' && row.floors !== '' && row.floors == 1 && (row.type.includes('{{ site.data.uk.re_house }}') || row.type.includes('{{ site.data.uk.re_house | downcase }}') || row.type.includes('{{ site.data.uk.re_roomsp }}'))) {
      html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_floor }}</dt><dd>' + row.floors + '{{ site.data.uk.re_fno }} {{ site.data.uk.re_floorsh }}</dd></dl></div>');
    } else if (row.floor == '' && row.floors !== '' && row.floors > 1 && (row.type.includes('{{ site.data.uk.re_house }}') || row.type.includes('{{ site.data.uk.re_house | downcase }}') || row.type.includes('{{ site.data.uk.re_roomsp }}'))) {
      html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_floor }}</dt><dd>' + row.floors + '{{ site.data.uk.re_fx }} {{ site.data.uk.re_floorsh }}</dd></dl></div>');
    } else {
      html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_floor }}</dt><dd>' + frY + ' {{ site.data.uk.re_at }} ' + flX() + ' {{ site.data.uk.re_floors }}</dd></dl></div>');
    }
    if (row.parking && row.parking !== '') {
      html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_parking }}</dt><dd>' + row.parking + '</dd></dl></div>');
    }
    if (row.object && row.object !== '') {
      html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_object }}</dt><dd>' + row.object + '</dd></dl></div>');
    }
  };

  var rePriceSqmt = function() {
    if (row.price !== '' && row.price_sqmt == '' && (row.type.includes('{{ site.data.uk.re_land }}') || row.type.includes('{{ site.data.uk.re_land | downcase }}'))) {
      if (row.price.includes('$')) {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_price_sqmtl }} {{ site.data.uk.m_za }}</dt><dd>' + (row.price.replace('$', '') / row.surface_land * usd).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      } else if (row.price.includes('€')) {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_price_sqmtl }} {{ site.data.uk.m_za }}</dt><dd>' + (row.price.replace('€', '') / row.surface_land * eur).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      } else if (row.price !== '') {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_price_sqmtl }} {{ site.data.uk.m_za }}</dt><dd>' + (row.price / row.surface_land * 1).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      }
    } else if (row.price == '' && row.price_sqmt !== '' && row.rent && row.rent !== '' && row.rent == 1) {
      if (row.price_sqmt.includes('$')) {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt.replace('$', '') * usd).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      } else if (row.price_sqmt.includes('€')) {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt.replace('€', '') * eur).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      } else if (row.price_sqmt !== '') {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_price_sqmtr }}</dt><dd>' + (row.price_sqmt * 1).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      }
    } else if (row.price !== '' && row.price_sqmt == '' && row.rent && row.rent !== '' && row.rent == 1 && row.type.includes('{{ site.data.uk.re_roomsp }}')) {
      if (row.price.includes('$')) {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_pricer | capitalize }}</dt><dd>' + (row.price.replace('$', '') * usd).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      } else if (row.price.includes('€')) {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_pricer | capitalize }}</dt><dd>' + (row.price.replace('€', '') * eur).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      } else if (row.price !== '') {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_pricer | capitalize }}</dt><dd>' + (row.price * 1).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      }
    } else if (row.price !== '' && row.price_sqmt !== '' && row.rent && row.rent !== '' && row.rent == 1 && row.type.includes('{{ site.data.uk.re_kvartyru }}')) {
      if (row.price.includes('$')) {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_price }}</dt><dd>' + (row.price.replace('$', '') * usd).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      } else if (row.price.includes('€')) {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_price }}</dt><dd>' + (row.price.replace('€', '') * eur).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      } else {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_price }}</dt><dd>' + (row.price * 1).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      }
    } else if (row.price !== '' && row.price_sqmt == '') {
      if (row.price.includes('$')) {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_price }}</dt><dd>' + (row.price.replace('$', '') * usd).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      } else if (row.price.includes('€')) {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_price }}</dt><dd>' + (row.price.replace('€', '') * eur).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      } else {
        html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_price }}</dt><dd>' + (row.price * 1).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</dd></dl></div>');
      }
    }
  };

  var images = Object.values(row.images || {});

  var reFooter = function() {
    if (isArchive) {
      html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_datea }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.uk.roku }}</dd></dl></div>');
    } else if (row.rent && row.rent !== '' && row.rent == 1) {
      html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_dater }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.uk.roku }}</dd></dl></div>');
    } else if (row.type.includes('{{ site.data.uk.re_land }}') || row.type.includes('{{ site.data.uk.re_land | downcase }}')) {
      html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_datel }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.uk.roku }}</dd></dl></div>');
    } else {
      html.push('<div class="col px-1"><dl><dt>{{ site.data.uk.re_date }}</dt><dd>' + d.getDate() + '&nbsp;' + month[n] + '&nbsp;' + d.getFullYear() + '&nbsp;{{ site.data.uk.roku }}</dd></dl></div>');
    }
    if (!isArchive && row.seller && row.seller !== '') {
      html.push('<div class="col px-1"><dl><dt>' + reSelleOrSeller + '</dt><dd><a href="{{ site.url }}/region/{{ site.region_slug }}/?id=' + row.phone + '" title="{{ site.data.uk.offers }}">' + row.seller.replace('{{ site.data.uk.re_seller }} ', '') + '</a></dd></dl></div><div class="col px-1"><dl><dt>' + rePhoneOrPhoner + '</dt><dd class="mb-0"><button type="button" class="btn btn-link tel-btn p-0 m-0" data-id="' + row.id + '" title="Клікніть для перегляду телефону"><canvas class="tel-canvas-table"></canvas></button></dd></dl></div></div>');
    } else if (isArchive || !row.seller || row.seller === '') {
      html.push('</div>');
    }
    if (row.description && row.description !== '' && (images.length > 1 || images.length == 0)) {
      html.push('<div class="row mx-n1">');
      html.push('<div class="col-12 px-1"><dl><dt>{{ site.data.uk.re_description }}</dt><dd>' + row.description + '</dd></dl></div>');
      html.push('</div>');
    }
  };

  $.each(row, function(key, value) {
    if (key !== 'images' && key !== 'id' && value !== '') {
      reHeader();
      rePriceSqmt();
      reFooter();
    }
  });

  var district = row.region.replace('кий район', 'кому районі');
  if (images.length == 1) {
    html.push('<hr class="mt-0"><div class="row row-cols-1 row-cols-sm-2 row-cols-md-2 mx-n1">');
    html.push(images.map(function(image) {
      return '<figure class="col-md-2 order-2 order-md-1 px-1 mb-0"><a href="' + image.src + '" class="lightbox" title="' + image.title + '" data-lightbox-caption="{{ site.data.uk.re_free_ads_in }} ' + row.location + '' + district + '" data-lightbox-width="800" data-lightbox-height="600" data-lightbox-group="re-' + row.id + '4' + row.phone + '"><img src="' + image.src + '" loading="lazy" title="' + image.title + '" alt="' + image.alt + '" class="img-fluid img-thumbnail" width="170" height="130"></a></figure>';
    }).join(''));
    html.push('<div class="col-md-10 order-md-2 px-1"><dl><dt>{{ site.data.uk.re_description }}</td><dd>' + row.description + '</dd></dl></div>');
    html.push('</div>');
  } else if (images.length > 1) {
    html.push('<hr class="mt-0"><div class="row row-cols-1 row-cols-sm-2 row-cols-md-4 mx-n1">');
    html.push(images.map(function(image) {
      return '<figure class="col px-1 mb-0"><a href="' + image.src + '" class="lightbox" title="' + image.title + '" data-lightbox-caption="{{ site.data.uk.re_free_ads_in }} ' + row.location + '' + district + '" data-lightbox-width="800" data-lightbox-height="600" data-lightbox-group="re-' + row.id + '4' + row.phone + '"><img src="' + image.src + '" loading="lazy" title="' + image.title + '" alt="' + image.alt + '" class="img-fluid img-thumbnail" width="380" height="285"></a></figure>';
    }).join(''));
    html.push('</div>');
  }
  $detail.html(html.join(''));
  $('.tel-canvas-table').each(function() {
    drawPlaceholder(this);
  });
}

function propertyFormatter(value, row) {
  "use strict";
  var reProdayu = (row.type.includes('{{ site.data.uk.re_kvartyru }}')) ? "{{ site.data.uk.re_sale }}" : "{{ site.data.uk.re_for_sale }}";
  var reRoomOrPrym = (row.type.includes('{{ site.data.uk.re_roomsp }}')) ? "{{ site.data.uk.re_roomsps }}" : "{{ site.data.uk.re_rooms }}";
  if (value !== '') {
    if (row.type.includes('{{ site.data.uk.re_land }}') || row.type.includes('{{ site.data.uk.re_land | downcase }}')) {
      if (row.rent === '1') {
        html = ['{{ site.data.uk.re_for_rent }} <b class="text-lowercase">' + row.type + '</b>, '];
      } else {
        html = ['{{ site.data.uk.re_for_sale }} <b class="text-lowercase">' + row.type + '</b>, '];
      }
      if (row.surface_land && row.surface_land !== '') {
        html.push('{{ site.data.uk.re_surface }} <b>' + row.surface_land + '</b> м² (' + (row.surface_land / 10000) + ' га)');
      }
      if (row.location && row.location !== '') {
        html.push(', {{ site.data.uk.re_location }} <b>{{ site.data.uk.re_at }} ' + row.location + '</b>, ');
      }
      if (row.address && row.address !== '' && row.location !== '') {
        html.push('{{ site.data.uk.re_address }} <b>' + row.address + '</b>');
      }
      if (row.address && row.address !== '' && row.location === '') {
        html.push(', {{ site.data.uk.re_location }} {{ site.data.uk.re_address }} <b>' + row.address + '</b>');
      }
      if (row.region && row.region !== '' && row.location === '') {
        html.push(', ' + row.region + '.');
      }
      if (row.page && row.page == 1) {
        html.push(' <a href="{{ site.url }}/' + row.phone + '" target="_blank">{{ site.data.uk.re_page_ads }}</a>.');
      } else if (row.link && row.link !== '') {
        html.push(' <a href=' + row.link + '>{{ site.data.uk.re_page_ads }}</a>.');
      }
    } else if (row.rent !== '' && row.rent == 1 && row.price !== '') {
      html = ['{{ site.data.uk.re_for_rent }} <b class="text-lowercase">' + row.type + '</b>, '];
      if (row.surface && row.surface !== '') {
        html.push('{{ site.data.uk.re_surface }} <b>' + row.surface + '</b> м², ');
      }
      if (row.rooms && row.rooms !== '') {
        html.push(reRoomOrPrym + ' ' + row.rooms + ', ');
      }
      if (row.floor && row.floor !== '') {
        html.push('{{ site.data.uk.re_na }} <b>' + row.floor + '</b>{{ site.data.uk.re_mu }} {{ site.data.uk.re_floorci }}, ');
      }
      if (row.floor == '' && row.floors !== '') {
        html.push('{{ site.data.uk.re_at }} <b>' + row.floors + '</b> {{ site.data.uk.re_floors }}, ');
      }
      if (row.location && row.location !== '') {
        html.push('{{ site.data.uk.re_location }} {{ site.data.uk.re_at }} <b>' + row.location + '</b>, {{ site.data.uk.re_address }} <b>' + row.address + '</b>');
      }
      if (row.region && row.region !== '') {
        html.push('{{ site.data.uk.re_address }} <b>' + row.address + '</b>, ' + row.region + '.');
      }
      if (row.page && row.page == 1) {
        html.push(' <a href="{{ site.url }}/' + row.phone + '" target="_blank">{{ site.data.uk.re_page_ads }}</a>.');
      } else if (row.link && row.link !== '') {
        html.push(' <a href=' + row.link + '>{{ site.data.uk.re_page_ads }}</a>.');
      }
    } else if (row.rent !== '' && row.rent == 1 && row.price == '' && row.price_sqmt !== '') {
      html = ['{{ site.data.uk.re_for_rentd }} <b class="text-lowercase">' + row.type + '</b>, '];
      if (row.surface && row.surface !== '') {
        html.push('{{ site.data.uk.re_surface }} <b>' + row.surface + '</b> м², ');
      }
      if (row.rooms && row.rooms !== '') {
        html.push(reRoomOrPrym + ' ' + row.rooms + ', ');
      }
      if (row.floor && row.floor !== '') {
        html.push('{{ site.data.uk.re_na }} <b>' + row.floor + '</b>{{ site.data.uk.re_mu }} {{ site.data.uk.re_floorci }}, ');
      }
      if (row.floor == '' && row.floors !== '') {
        html.push('{{ site.data.uk.re_at }} <b>' + row.floors + '</b> {{ site.data.uk.re_floors }}, ');
      }
      if (row.location && row.location !== '') {
        html.push('{{ site.data.uk.re_location }} {{ site.data.uk.re_at }} <b>' + row.location + '</b>, {{ site.data.uk.re_address }} <b>' + row.address + '</b>.');
      }
      if (row.region && row.region !== '') {
        html.push('{{ site.data.uk.re_address }} <b>' + row.address + '</b>, ' + row.region + '.');
      }
      if (row.page && row.page == 1) {
        html.push(' <a href="{{ site.url }}/' + row.phone + '" target="_blank">{{ site.data.uk.re_page_ads }}</a>.');
      } else if (row.link && row.link !== '') {
        html.push(' <a href=' + row.link + '>{{ site.data.uk.re_page_ads }}</a>.');
      }
    } else {
      html = [reProdayu + ' <b class="text-lowercase">' + row.type + '</b>, '];
      if (row.surface && row.surface !== '') {
        html.push('{{ site.data.uk.re_surface }} <b>' + row.surface + '</b> м², ');
      }
      if (row.rooms && row.rooms !== '') {
        html.push(reRoomOrPrym + ' ' + row.rooms + ', ');
      }
      if (row.type.includes('{{ site.data.uk.re_house }}') || row.type.includes('{{ site.data.uk.re_house | downcase }}')) {
        if (row.floors && row.floors !== '') {
          html.push('{{ site.data.uk.re_floorss }} <b>' + row.floors + '</b>, ');
        }
      } else {
        if (row.floor && row.floor !== '') {
          html.push('{{ site.data.uk.re_na }} <b>' + row.floor + '</b>{{ site.data.uk.re_mu }} {{ site.data.uk.re_floorci }}, ');
        }
      }
      if (row.region && row.region !== '' && row.region.includes('{{ site.data.uk.district }}')) {
        if (row.region && row.region !== '') {
          html.push('{{ site.data.uk.re_address }} <b>' + row.address + '</b>, ' + row.region + '.');
        }
        if (row.page && row.page == 1) {
          html.push(' <a href="{{ site.url }}/' + row.phone + '" target="_blank">{{ site.data.uk.re_page_ads }}</a>.');
        } else if (row.link && row.link !== '') {
          html.push(' <a href=' + row.link + '>{{ site.data.uk.re_page_ads }}</a>.');
        }
      } else {
        if (row.location && row.location !== '') {
          html.push('{{ site.data.uk.re_location }} {{ site.data.uk.re_at }} <b>' + row.location + '</b>, {{ site.data.uk.re_address }} <b>' + row.address + '</b>.');
        }
        if (row.page && row.page == 1) {
          html.push(' <a href="{{ site.url }}/' + row.phone + '" target="_blank">{{ site.data.uk.re_page_ads }}</a>.');
        } else if (row.link && row.link !== '') {
          html.push(' <a href=' + row.link + '>{{ site.data.uk.re_page_ads }}</a>.');
        }
      }
    }
  }
  return html.join('');
}

function priceFormatter(value, row) {
  "use strict";
  if (value !== '' && value.includes('$')) {
    return '<div data-toggle="tooltip" title="' + value + '">' + (value.replace('$', '') * usd).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</div>';
  } else if (value !== '' && value.includes('€')) {
    return '<div data-toggle="tooltip" title="' + value + '">' + (value.replace('€', '') * eur).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</div>';
  } else if (value == '' && row.price_sqmt !== '') {
    if (row.price_sqmt !== '' && row.price_sqmt.includes('$')) {
      return '<div data-toggle="tooltip" title="' + row.price_sqmt + '">' + (row.price_sqmt.replace('$', '') * usd).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</div>';
    } else if (row.price_sqmt !== '' && row.price_sqmt.includes('€')) {
      return '<div data-toggle="tooltip" title="' + row.price_sqmt + '">' + (row.price_sqmt.replace('€', '') * eur).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</div>';
    } else if (row.price_sqmt !== '') {
      return '<div data-toggle="tooltip" title="$' + (row.price_sqmt / nbu).toFixed(0) + '">' + (row.price_sqmt * 1).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</div>';
    }
  } else {
    return '<div data-toggle="tooltip" title="$' + (value / nbu).toFixed(0) + '">' + (value * 1).toFixed(0) + '&nbsp;{{ site.data.uk.re_uah }}</div>';
  }
}

function priceSorter(a, b) {
  var s = /[$€₴]/g;
  var aa = a.replace(s, '');
  var bb = b.replace(s, '');
  return aa - bb;
}

$('.page-link[href="javascript:void(0)"]').attr('href', '#');
$('.fixed-table-toolbar .search-input').each(function(i) {
  $(this).attr({ id: 'tableSearch' + (i + 1), name: 'tableSearch' });
});
