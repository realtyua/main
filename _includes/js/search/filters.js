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
    var allItems = RE.searchEngine.search({ filters: {}, per_page: 9999, page: 1 }).data.items;
    var items = allItems.filter(function(item) {
      if (RE.searchState.f.type && !RE.matchType(item.type, RE.searchState.f.type)) return false;
      if (RE.searchState.f.rent !== undefined && item.rent !== RE.searchState.f.rent) return false;
      if (RE.searchState.f.loc && !RE.matchLoc(item, RE.searchState.f.loc)) return false;
      if (RE.searchState.f.addr && item.street !== RE.searchState.f.addr) return false;
      if (RE.searchState.f.rooms) {
        if (RE.searchState.f.rooms.min && item.rooms_int < RE.searchState.f.rooms.min) return false;
        if (RE.searchState.f.rooms.max && item.rooms_int > RE.searchState.f.rooms.max) return false;
      }
      if (RE.searchState.f.surface) {
        if (RE.searchState.f.surface.min && item.surface_f < RE.searchState.f.surface.min) return false;
        if (RE.searchState.f.surface.max && item.surface_f > RE.searchState.f.surface.max) return false;
      }
      if (RE.searchState.f.land) {
        if (RE.searchState.f.land.min && item.surface_land_f < RE.searchState.f.land.min) return false;
        if (RE.searchState.f.land.max && item.surface_land_f > RE.searchState.f.land.max) return false;
      }
      if (RE.searchState.f.floor) {
        if (RE.searchState.f.floor.min && item.floor_int < RE.searchState.f.floor.min) return false;
        if (RE.searchState.f.floor.max && item.floor_int > RE.searchState.f.floor.max) return false;
      }
      if (RE.searchState.f.floors) {
        if (RE.searchState.f.floors.min && item.floors_int < RE.searchState.f.floors.min) return false;
        if (RE.searchState.f.floors.max && item.floors_int > RE.searchState.f.floors.max) return false;
      }
      if (RE.searchState.f.price) {
        if (RE.searchState.f.price.min && item.price_uah < RE.inputPriceToUAH(RE.searchState.f.price.min)) return false;
        if (RE.searchState.f.price.max && item.price_uah > RE.inputPriceToUAH(RE.searchState.f.price.max)) return false;
      }
      return true;
    });
    if (RE.searchState.sort === 'desc') {
      items.sort(function(a, b) { return (b.price_uah || 0) - (a.price_uah || 0); });
    } else if (RE.searchState.sort === 'asc') {
      items.sort(function(a, b) { return (a.price_uah || 0) - (b.price_uah || 0); });
    }
    var total   = items.length;
    var start   = (RE.searchPage - 1) * RE.SEARCH_PER_PAGE;
    var pageItems = items.slice(start, start + RE.SEARCH_PER_PAGE);
    RE.renderResults(pageItems, { total: total });
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
