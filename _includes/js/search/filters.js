(function(RE) {
  'use strict';

  RE.TYPE_GROUPS = [
    {
      tag:      'Будинок',
      triggers: ['частина будинку', 'будинок', 'хата'],
      filters:  ['будинок'],
      chips:    ['rent','loc','addr','rooms','surface','land','floors','price'],
    },
    {
      tag:      'Квартира',
      triggers: ['частина квартири', 'квартира', 'кімната'],
      filters:  ['квартира', 'кімнат'],
      chips:    ['rent','loc','addr','rooms','surface','floor','floors','price'],
    },
    {
      tag:      'Гараж',
      triggers: ['місце для паркування', 'паркомісце', 'гараж'],
      filters:  ['гараж', 'паркування'],
      chips:    ['rent','loc','addr','surface','price'],
    },
    {
      tag:      'Нежитлове приміщення',
      triggers: ['нежитлове приміщення', 'комерційне приміщення', 'приміщення', 'комерція'],
      filters:  ['нежитлове приміщення'],
      chips:    ['rent','loc','addr','surface','land','floor','price'],
    },
    {
      tag:      'Земля',
      triggers: ['земельна ділянка', 'ділянка землі', 'земля', 'ділянка'],
      filters:  ['земля'],
      chips:    ['rent','loc','addr','land','price'],
    },
  ];

  RE.DEFAULT_GROUP = {
    tag:      'Всі оголошення',
    triggers: [],
    filters:  [],
    chips:    ['rent','loc','addr'],
  };

  RE.DEFAULT_CHIPS = RE.DEFAULT_GROUP.chips;

  RE.CHIP_LABELS = {
    rent:    'Оренда/Продаж',
    loc:     'Населений пункт',
    addr:    'Адреса',
    rooms:   'Кімнати',
    surface: 'Площа м²',
    land:    'Ділянка',
    floor:   'Поверх',
    floors:  'Поверхів',
    price:   'Ціна',
  };

  RE.matchType = function(itemType, tag) {
    var group = RE.getTypeGroup(tag);
    if (!group) return false;
    var t = (itemType || '').toLowerCase();
    for (var i = 0; i < group.filters.length; i++) {
      if (t.includes(group.filters[i].toLowerCase())) return true;
    }
    return false;
  };

  RE.matchLoc = function(item, locVal) {
    var placeType = RE.searchPlaceTypes[locVal] || 'city';
    if (placeType === 'city') {
      var cityClean = (item.location || '').replace('м. ', '').toLowerCase().trim();
      return cityClean === locVal;
    }
    if (placeType === 'region') {
      var regClean = (item.region || '').replace(' район', '').toLowerCase().trim();
      return regClean === locVal;
    }
    var addr = (item.address || '').replace(/\bc./g, 'с.').toLowerCase();
    return addr.includes(locVal.toLowerCase());
  };

  RE.buildAddr = function(item) {
    var parts = [];
    if (item.location) {
      parts.push('м. ' + RE.capitalize(item.location.replace('м. ', '').trim()));
    } else if (item.region) {
      parts.push(RE.capitalize(item.region.replace(' район', '').trim()) + ' район');
    }
    if (item.address) parts.push(item.address);
    return parts.join(', ');
  };

  RE.runSearch = function() {
    if (!RE.searchEngine) return;
    var f = RE.searchState.f;
    var ids = RE.getFilteredIds(f);
    if (!ids.length) {
      RE.renderResults([], { total: 0 });
      return;
    }
    var filters = {};
    if (f.type) filters.type_category = [f.type];
    if (f.rent !== undefined) filters.rent = [String(f.rent)];
    if (f.addr) filters.street = [f.addr];
    if (f.loc) {
      var placeType = RE.searchPlaceTypes[f.loc] || 'city';
      if (placeType === 'city') {
        filters.location_city = [f.loc];
      } else if (placeType === 'region') {
        filters.location_region = [f.loc];
      }
    }
    var sort;
    if (RE.searchState.sort === 'desc') sort = 'price_desc';
    else if (RE.searchState.sort === 'asc') sort = 'price_asc';
    var searchParams = { per_page: RE.SEARCH_PER_PAGE, page: RE.searchPage };
    if (Object.keys(filters).length) searchParams.filters = filters;
    if (sort) searchParams.sort = sort;
    searchParams._ids = ids;
    var res = RE.searchEngine.search(searchParams);
    RE.renderResults(res.data.items, { total: res.pagination.total });
  };

  RE.applySearchSimple = function(k, v) {
    if (v !== '') RE.searchState.f[k] = v;
    else delete RE.searchState.f[k];
    RE.searchPage = 1;
    RE.renderSearchTags();
    RE.renderSearchChips();
    RE.runSearch();
  };

  RE.applySearchRange = function(k, side, v) {
    if (!RE.searchState.f[k] || typeof RE.searchState.f[k] !== 'object') RE.searchState.f[k] = {};
    if (v) RE.searchState.f[k][side] = parseFloat(v);
    else delete RE.searchState.f[k][side];
    if (!RE.searchState.f[k].min && !RE.searchState.f[k].max) delete RE.searchState.f[k];
    RE.searchPage = 1;
    RE.renderSearchTags();
    RE.renderSearchChips();
    RE.runSearch();
  };

  RE.setSortPrice = function(order, e) {
    if (e) e.stopPropagation();
    if (RE.searchState.sort === order) {
      RE.searchState.sort = null;
    } else {
      RE.searchState.sort = order;
    }
    RE.searchPage = 1;
    RE.runSearch();
    var $target = $('#collapseAreaSelect');
    if ($target.length) {
      var t = $target.offset().top - 20;
      $('html, body').animate({ scrollTop: t }, 300);
    }
  };
})(window.RE);
