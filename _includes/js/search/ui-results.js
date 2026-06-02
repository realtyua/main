(function(RE) {
  'use strict';

  function ukrPageLabel(page, total) {
    var p = page % 10, t = page % 100;
    if (p === 1 && t !== 11) return '\u041f\u043e\u043a\u0430\u0437\u0430\u043d\u043e ' + page + ' \u0441\u0442\u043e\u0440\u0456\u043d\u043a\u0443 \u0437 ' + total;
    if (p >= 2 && p <= 4 && (t < 12 || t > 14)) return '\u041f\u043e\u043a\u0430\u0437\u0430\u043d\u043e ' + page + ' \u0441\u0442\u043e\u0440\u0456\u043d\u043a\u0438 \u0437 ' + total;
    return '\u041f\u043e\u043a\u0430\u0437\u0430\u043d\u043e ' + page + ' \u0441\u0442\u043e\u0440\u0456\u043d\u043e\u043a \u0437 ' + total;
  }

  function roomsLabel(item) {
    if (!item.rooms || item.type_category === '\u0417\u0435\u043c\u043b\u044f') return '';
    var suffix = (item.type || '').includes('\u043f\u0440\u0438\u043c\u0456\u0449\u0435\u043d\u043d\u044f') || item.type === '\u0413\u0430\u0440\u0430\u0436'
      ? ' \u043f\u0440\u0438\u043c.'
      : ' \u043a\u0456\u043c\u043d.';
    return item.rooms + suffix;
  }

  RE.renderResults = function(items, pagination) {
    var $list = $('#searchResultsList');
    var $wrap = $('#searchResults');
    if (!items.length) {
      $list.html('<div class="alert alert-info">\u041d\u0456\u0447\u043e\u0433\u043e \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e. \u0411\u0443\u0434\u044c \u043b\u0430\u0441\u043a\u0430 \u0441\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437, \u043d\u0435 \u043f\u043e\u0441\u043f\u0456\u0448\u0430\u044e\u0447\u0438.</div>');
      $wrap.removeClass('d-none');
      return;
    }
    var html = items.map(function(item) {
      var url   = item.link;
      var addr  = RE.buildAddr(item);
      var rooms = roomsLabel(item);
      var surf  = item.surface      ? item.surface + ' м²'              : '';
      var land  = item.surface_land ? item.surface_land + ' м² ділянка' : '';
      var floor = (item.floor_int && item.floors_int)
        ? item.floor_int + '/' + item.floors_int + ' пов.'
        : (item.floors_int ? item.floors_int + ' пов.' : '');
      var meta  = [rooms, surf, land, floor].filter(Boolean).join(' · ');
      var priceData = RE.formatPriceUAH(item);
      var priceHtml = '';
      if (priceData) {
        priceHtml =
          '<p class="card-text h5 mb-0 text-right">' +
            '<span class="badge badge-primary">' + priceData.uah + '</span>' +
          '</p>';
        if (priceData.orig) {
          priceHtml +=
            '<p class="card-text mb-1 text-right">' +
              '<small class="text-muted">(' + priceData.orig + ')</small>' +
            '</p>';
        }
      }
      var hasImg = item.images && item.images.length > 0 && item.images[0].src;
      var cardContent =
        '<div class="card-body">' +
          '<p class="card-title h5 mb-1 font-weight-bold">' +
            '<a href="' + url + '" class="stretched-link">' + item.type + '</a>' +
            ' → <span class="text-muted">' + (item.rent === '1' ? 'оренда' : 'продаж') + '</span>' +
          '</p>' +
          '<p class="card-text mb-1">' + addr + '</p>' +
          (meta ? '<p class="card-text mb-1 text-monospace">' + meta + '</p>' : '') +
          priceHtml +
        '</div>';
      if (hasImg) {
        return '<div class="card mb-3">' +
          '<div class="row no-gutters">' +
            '<div class="col-auto col-md-4">' +
              '<img loading="lazy" src="' + item.images[0].src + '" ' +
              'width="100%" height="100%" ' +
              'alt="' + (item.images[0].alt || '') + '" ' +
              'style="object-fit:cover;">' +
            '</div>' +
            '<div class="col-md">' + cardContent + '</div>' +
          '</div>' +
        '</div>';
      }
      return '<div class="card mb-3">' +
        '<div class="row no-gutters">' +
          '<div class="col-md">' + cardContent + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    var total = pagination.total;
    var pages = Math.ceil(total / RE.SEARCH_PER_PAGE);
    var topPager = '<div class="row justify-content-between mb-3">' +
      '<div class="col-md-auto align-self-center">' +
        '<span class="text-muted">' + ukrPageLabel(RE.searchPage, pages) + '</span>' +
      '</div>' +
      '<div class="col-md-auto">' +
        '<div class="row justify-content-between">' +
          '<div class="col-5 col-md-auto align-self-center">Знайдено: ' + total + '</div>' +
          '<div class="col-auto">' +
            '<div class="btn-group btn-group-sm" role="group">' +
              '<button type="button" class="btn btn-outline-secondary' + (RE.searchState.sort === 'desc' ? ' active' : '') + '" onclick="RE.setSortPrice(\'desc\', event)">Ціна ↓</button>' +
              '<button type="button" class="btn btn-outline-secondary' + (RE.searchState.sort === 'asc' ? ' active' : '') + '" onclick="RE.setSortPrice(\'asc\', event)">Ціна ↑</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
    var bottomPager = '<div class="row justify-content-between mb-3 mt-3">' +
      '<div class="col-md-auto align-self-center">' +
        '<span class="text-muted">' + ukrPageLabel(RE.searchPage, pages) + '</span>' +
      '</div>' +
      '<div class="col-md-auto">';
    if (RE.searchPage > 1) {
      bottomPager += '<button id="btnPrevPage" class="btn btn-sm btn-outline-primary mr-2">← Назад</button>';
    }
    if (RE.searchPage < pages) {
      bottomPager += '<button id="btnNextPage" class="btn btn-sm btn-outline-primary">Далі →</button>';
    }
    bottomPager += '</div></div>';
    $list.html(topPager + html + (pages > 1 ? bottomPager : ''));
    $wrap.removeClass('d-none');
    $(document).off('click', '#btnNextPage');
    $(document).off('click', '#btnPrevPage');
    $(document).on('click', '#btnNextPage', function(e) {
      e.stopPropagation();
      RE.searchPage++;
      RE.runSearch();
      var $target = $('#collapseAreaSelect');
      if ($target.length) {
        var t = $target.offset().top - 20;
        $('html, body').animate({ scrollTop: t }, 300);
      }
    });
    $(document).on('click', '#btnPrevPage', function(e) {
      e.stopPropagation();
      RE.searchPage--;
      RE.runSearch();
      var $target = $('#collapseAreaSelect');
      if ($target.length) {
        var t = $target.offset().top - 20;
        $('html, body').animate({ scrollTop: t }, 300);
      }
    });
  };
})(window.RE);
