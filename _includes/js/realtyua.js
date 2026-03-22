// realtyua.v0.15.js
// v0.1  — базовий Tom Select + Bootstrap
// v0.2  — перемикач режимів пошуку
// v0.3  — ItemsJS + loadSearchEngine
// v0.4  — parseQuery (парсер запитів)
// v0.5  — renderResults + пагінація
// v0.6  — searchPlaces (міста+райони+села)
// v0.7  — фікс collapse пагінації + розділення міст/районів + покращений regex сіл
// v0.8  — теги в полі пошуку + кнопки фільтрів + Tom Select для населеного пункту
// v0.9  — виправлено фільтри: type/loc/price через includes() + AND логіка
// v0.10 — кнопки Продаж/Оренда взаємовиключні + фікс placeholder + фікс collapse на тегах
// v0.11 — фокус після пагінації + ціна за добу + відображення цін у гривнях + setTimeout фокус
// v0.12 — стилі кнопок/тегів + картка з фото/без + виправлення фільтру ціни у гривнях
// v0.13 — клас rounded для фото + фільтр Адреса + великі букви міст/районів + скид сторінки
// v0.14 — точний збіг loc для міст/районів + префікс м./район у картці + фільтр вулиць від сіл
// v0.15 — розширений список non-street префіксів: присілок/урочище/масив/мікрорайон тощо

"use strict";

$(document).ready(function () {

  $("body").tooltip({ selector: '[data-toggle="tooltip"]' });
  $('[data-toggle="popover"]').popover();

  $('.nav-tabs>li>a.nav-link').on('click', function () {
    $('.navbar-collapse').collapse('hide');
  });

  $(document).on('click', function (e) {
    if ($(e.target).closest(".card").length === 0 &&
        $(e.target).closest("#searchResults").length === 0 &&
        $(e.target).closest("#searchObj").length === 0 &&
        $(e.target).closest("#searchModeRadios").length === 0) {
      $('.collapse').collapse('hide');
    }
  });

  $('.toast').toast('show');
  $('.alert').alert();

  var tomSelectInstance = new TomSelect('#rehiony', {
    create: false,
    maxOptions: 10,
    maxItems: 1,
    valueField: 'url',
    labelField: 'title',
    searchField: 'title',
    sortField: 'title',
    options: [
      {%- for r in site.data.realestate -%}
        {%- if r.url == site.url and r.slug and r.slug != '' -%}
          {%- include select/0.html -%}
        {%- elsif r.slug and r.slug != '' and r.url contains 'https' -%}
          {%- assign d = r.url | remove: 'https://www.realestate.' | remove: '.ua' -%}
          {%- if site.data[d] -%}
            {%- for o in site.data[d] -%}
              {url:"{{ o.url }}",title:"{{ o.title }}"},
            {%- endfor -%}
          {%- endif -%}
        {%- else -%}
          {url:"{{ r.url }}",title:"{{ r.small }}"},
        {%- endif -%}
      {%- endfor -%}
      {url:"{{ site.url }}/region/{{ site.region_slug }}/",title:"{{ site.region }}"}
    ],
    render: {
      no_results: function (data, escape) {
        return '<div class="no-results">За цим запитом "' + escape(data.input) + '" нічого не знайдено</div>';
      }
    },
    onChange: function (value) {
      if (value !== '') {
        window.location = value;
      }
    }
  });

  $('input[name="searchMode"]').on('change', function () {
    if ($(this).val() === 'loc') {
      $('#searchLoc').removeClass('d-none').css('display', 'block');
      $('#searchObj').addClass('d-none').css('display', 'none');
      $('#searchResults').addClass('d-none').css('display', 'none');
    } else {
      $('#searchLoc').addClass('d-none').css('display', 'none');
      $('#searchObj').removeClass('d-none').css('display', 'block');
      setTimeout(function () {
        $('#searchListings').focus();
      }, 50);
    }
  });

  $('#searchListings').on('input', function () {
    var query = $(this).val().trim();
    if (query.length < 1) return;

    loadSearchEngine(function () {
      for (var i = 0; i < searchTypes.length; i++) {
        if (query.toLowerCase().includes(searchTypes[i])) {
          var typeName = searchTypes[i].charAt(0).toUpperCase() + searchTypes[i].slice(1);
          if (searchState.type !== typeName) {
            searchState.type      = typeName;
            searchState.f['type'] = typeName;
            $('#searchListings').val('');
            renderSearchTags();
            renderSearchChips();
          }
          break;
        }
      }
      if (Object.keys(searchState.f).length > 0) {
        searchPage = 1;
        runSearchWithState();
      }
    });
  });

});

var sShare = {
  show: function (url, windowHeight, windowWidth) {
    var height = windowHeight || 420;
    var width  = windowWidth  || 550;
    var top    = (window.screen.height / 2) - (height / 2);
    var left   = (window.screen.width  / 2) - (width  / 2);
    return window.open(
      url, 'share',
      'toolbar=no,location=no,directories=no,status=no,menubar=no,' +
      'scrollbars=no,resizable=yes,copyhistory=no,' +
      'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left
    );
  }
};

var searchEngine      = null;
var searchLocations   = [];
var searchRegions     = [];
var searchTypes       = [];
var searchPlaces      = [];
var searchStreets     = [];
var searchPage        = 1;
var searchPerPage     = 10;
var searchLastFilters = {};
var searchPlaceTypes  = {};
var nbuRates = { USD: {{ site.usd }}, EUR: {{ site.eur }} };

// префікси що НЕ є вулицями — не потрапляють в [+ Адреса]
var NON_STREET_PREFIXES = [
  'с.', 'с.м.т.', 'смт', 'село ', 'селище ',
  'c.', 'C.',
  'присілок', 'урочище', 'масив ', 'мікрорайон', 'мікро район',
  'садове товариство', 'садівниче товариство',
  'дачне селище', 'поселення '
];

var CHIPS_BY_TYPE = {
  'будинок':              ['rent','loc','addr','rooms','surface','land','floors','price'],
  'квартира':             ['rent','loc','addr','rooms','surface','floor','floors','price'],
  'земля':                ['rent','loc','addr','land','price'],
  'нежитлове приміщення': ['rent','loc','addr','surface','land','floor','price'],
  'гараж':                ['rent','loc','addr','surface','price'],
  'default':              ['rent','loc','addr','surface','land','price'],
};

var CHIP_LABELS = {
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

var searchState = { type: null, activeChip: null, f: {}, tsLoc: null, tsAddr: null };

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function isNonStreet(str) {
  var s = str.trim();
  for (var i = 0; i < NON_STREET_PREFIXES.length; i++) {
    if (s.toLowerCase().startsWith(NON_STREET_PREFIXES[i].toLowerCase())) return true;
  }
  return false;
}

function priceToUAH(priceStr) {
  if (!priceStr) return 0;
  var s = String(priceStr).trim();
  if (s.startsWith('$')) return parseInt(s.slice(1)) * nbuRates.USD;
  if (s.startsWith('€')) return parseInt(s.slice(1)) * nbuRates.EUR;
  return parseInt(s) || 0;
}

function inputPriceToUAH(val) {
  return parseFloat(val);
}

function formatPrice(item) {
  var price    = String(item.price     || '').trim();
  var priceSqm = String(item.price_sqmt || '').trim();
  var isRent   = item.rent === '1';

  if (isRent && !price && priceSqm) {
    var num = parseInt(priceSqm);
    if (!isNaN(num)) {
      return '<span class="d-block badge badge-primary">' + num.toLocaleString('uk-UA') + '&nbsp;₴/доба</span>';
    }
  }

  if (!price) return '';

  var uah  = 0;
  var orig = '';

  if (price.startsWith('$')) {
    uah  = parseInt(price.slice(1)) * nbuRates.USD;
    orig = price;
  } else if (price.startsWith('€')) {
    uah  = parseInt(price.slice(1)) * nbuRates.EUR;
    orig = price;
  } else {
    uah  = parseInt(price);
    orig = '';
  }

  if (isNaN(uah) || uah === 0) return '';

  var uahStr = Math.round(uah).toLocaleString('uk-UA').replace(/,/g, '&nbsp;') + '₴';
  var result = '<span class="d-block badge badge-primary">' + uahStr + '</span>';
  if (orig) {
    result += '<small class="d-block text-muted">(' + orig + ')</small>';
  }
  return result;
}

function updateSearchPlaceholder() {
  var input   = document.getElementById('searchListings');
  var hasTags = Object.keys(searchState.f).length > 0;
  input.placeholder = hasTags ? '' : 'будинок, квартира, земля...';
}

function loadSearchEngine(callback) {
  if (searchEngine) { callback(); return; }
  fetch('{{ site.url }}/region/{{ site.region_slug }}/data/all.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      data.forEach(function (item) {
        item.price_uah      = priceToUAH(item.price);
        item.location_clean = (item.location || item.region || '')
                               .replace('м. ', '').replace(' район', '').toLowerCase().trim();
        item.floors_int     = parseInt(item.floors) || 0;
        item.floor_int      = parseInt(item.floor)  || 0;
        item.rooms_int      = parseInt(item.rooms)  || 0;
        item.surface_f      = parseFloat(item.surface)      || 0;
        item.surface_land_f = parseFloat(item.surface_land) || 0;
        // вулиця — перша частина address до коми, тільки якщо це справді вулиця
        var firstPart = (item.address || '').split(',')[0].trim();
        item.street = isNonStreet(firstPart) ? '' : firstPart;
      });

      searchLocations = [...new Set(
        data.map(function (i) {
          return i.location
            ? i.location.replace('м. ', '').toLowerCase().trim()
            : null;
        }).filter(Boolean)
      )];

      searchRegions = [...new Set(
        data.map(function (i) {
          return i.region
            ? i.region.replace(' район', '').toLowerCase().trim()
            : null;
        }).filter(Boolean)
      )];

      searchTypes = [...new Set(
        data.map(function (i) { return (i.type || '').toLowerCase().trim(); }).filter(Boolean)
      )];

      // вулиці — без non-street префіксів
      searchStreets = [...new Set(
        data.map(function (i) { return i.street; }).filter(Boolean)
      )].sort(function (a, b) { return a.localeCompare(b, 'uk'); });

      // села/селища з address через regex
      var villages = [];
      data.forEach(function (item) {
        var addr = item.address || '';
        // також ловимо латинську c. як кириличну с.
        var normalized = addr.replace(/\bc\./g, 'с.');
        var matches = normalized.match(/с\.м?\.?т?\.?\s+[^,]+/g);
        if (matches) {
          villages = villages.concat(matches.map(function (v) { return v.trim(); }));
        }
      });
      var searchVillages = [...new Set(villages)];

      // зберігаємо тип кожного place
      searchPlaceTypes = {};
      searchLocations.forEach(function (l) { searchPlaceTypes[l] = 'city'; });
      searchRegions.forEach(function (r)   { searchPlaceTypes[r] = 'region'; });
      searchVillages.forEach(function (v)  { searchPlaceTypes[v] = 'village'; });

      searchPlaces = [].concat(
        searchLocations.map(function (l) {
          return { value: l, text: 'м. ' + capitalize(l), group: 'Міста' };
        }),
        searchRegions.map(function (r) {
          return { value: r, text: capitalize(r) + ' район', group: 'Райони' };
        }),
        searchVillages.map(function (v) {
          return { value: v, text: v, group: 'Села/Селища' };
        })
      ).sort(function (a, b) { return a.text.localeCompare(b.text, 'uk'); });

      searchEngine = itemsjs(data, {
        aggregations: {
          type:           { title: 'Тип',   size: 20 },
          location_clean: { title: 'Місто', size: 30 },
          rent:           { title: 'Угода', size: 5  }
        }
      });
      callback();
    })
    .catch(function (e) { console.error('JSON load error', e); });
}

function matchLoc(item, locVal) {
  var placeType = searchPlaceTypes[locVal] || 'city';

  if (placeType === 'city') {
    var cityClean = (item.location || '').replace('м. ', '').toLowerCase().trim();
    return cityClean === locVal;
  }

  if (placeType === 'region') {
    var regClean = (item.region || '').replace(' район', '').toLowerCase().trim();
    return regClean === locVal;
  }

  // село — шукаємо в address (з урахуванням латинської c.)
  var addr = (item.address || '').replace(/\bc\./g, 'с.').toLowerCase();
  return addr.includes(locVal.toLowerCase());
}

function buildAddr(item) {
  var parts = [];

  if (item.location) {
    parts.push('м. ' + capitalize(item.location.replace('м. ', '').trim()));
  } else if (item.region) {
    parts.push(capitalize(item.region.replace(' район', '').trim()) + ' район');
  }

  if (item.address) {
    parts.push(item.address);
  }

  return parts.join(', ');
}

function runSearchWithState() {
  if (!searchEngine) return;

  var allItems = searchEngine.search({ filters: {}, per_page: 9999, page: 1 }).data.items;

  var items = allItems.filter(function (item) {

    if (searchState.f.type) {
      if (!(item.type || '').toLowerCase().includes(searchState.f.type.toLowerCase())) return false;
    }

    if (searchState.f.rent !== undefined) {
      if (item.rent !== searchState.f.rent) return false;
    }

    if (searchState.f.loc) {
      if (!matchLoc(item, searchState.f.loc)) return false;
    }

    if (searchState.f.addr) {
      if (item.street !== searchState.f.addr) return false;
    }

    if (searchState.f.rooms) {
      if (searchState.f.rooms.min && item.rooms_int < searchState.f.rooms.min) return false;
      if (searchState.f.rooms.max && item.rooms_int > searchState.f.rooms.max) return false;
    }

    if (searchState.f.surface) {
      if (searchState.f.surface.min && item.surface_f < searchState.f.surface.min) return false;
      if (searchState.f.surface.max && item.surface_f > searchState.f.surface.max) return false;
    }

    if (searchState.f.land) {
      if (searchState.f.land.min && item.surface_land_f < searchState.f.land.min) return false;
      if (searchState.f.land.max && item.surface_land_f > searchState.f.land.max) return false;
    }

    if (searchState.f.floor) {
      if (searchState.f.floor.min && item.floor_int < searchState.f.floor.min) return false;
      if (searchState.f.floor.max && item.floor_int > searchState.f.floor.max) return false;
    }

    if (searchState.f.floors) {
      if (searchState.f.floors.min && item.floors_int < searchState.f.floors.min) return false;
      if (searchState.f.floors.max && item.floors_int > searchState.f.floors.max) return false;
    }

    if (searchState.f.price) {
      if (searchState.f.price.min && item.price_uah < inputPriceToUAH(searchState.f.price.min)) return false;
      if (searchState.f.price.max && item.price_uah > inputPriceToUAH(searchState.f.price.max)) return false;
    }

    return true;
  });

  var total     = items.length;
  var start     = (searchPage - 1) * searchPerPage;
  var pageItems = items.slice(start, start + searchPerPage);
  renderResults(pageItems, { total: total });
}

function searchTagLabel(k, v) {
  if (k === 'type')    return v;
  if (k === 'rent')    return v === '1' ? 'Оренда' : 'Продаж';
  if (k === 'loc') {
    var pt = searchPlaceTypes[v] || 'city';
    if (pt === 'city')   return 'м. ' + capitalize(v);
    if (pt === 'region') return capitalize(v) + ' район';
    return v;
  }
  if (k === 'addr')    return v;
  if (k === 'rooms')   return searchRangeLabel(v, 'кімн.', '');
  if (k === 'surface') return searchRangeLabel(v, 'м²', '');
  if (k === 'land')    return searchRangeLabel(v, 'м² ділянка', '');
  if (k === 'floor')   return searchRangeLabel(v, 'поверх', '');
  if (k === 'floors')  return searchRangeLabel(v, 'поверхів', '');
  if (k === 'price')   return searchRangeLabel(v, '₴', '');
  return String(v);
}

function searchRangeLabel(v, unit, prefix) {
  if (typeof v === 'string') return v;
  var p = prefix || '';
  var u = unit ? ' ' + unit : '';
  if (v.min && v.max) return p + v.min + '–' + p + v.max + u;
  if (v.min)          return 'від ' + p + v.min + u;
  if (v.max)          return 'до '  + p + v.max + u;
  return unit || '';
}

function renderSearchTags() {
  var html = Object.keys(searchState.f).map(function (k) {
    return '<span class="badge badge-success mr-1 mb-1" style="font-size:12px;font-weight:400;padding:4px 8px;">' +
      searchTagLabel(k, searchState.f[k]) +
      ' <span style="cursor:pointer;margin-left:4px;" onclick="removeSearchTag(event,\'' + k + '\')">×</span>' +
    '</span>';
  }).join('');
  document.getElementById('searchTags').innerHTML = html;
  updateSearchPlaceholder();
}

function removeSearchTag(e, k) {
  e.stopPropagation();
  if (k === 'type') searchState.type = null;
  delete searchState.f[k];
  if (k === 'loc' && searchState.tsLoc) {
    searchState.tsLoc.destroy();
    searchState.tsLoc = null;
  }
  if (k === 'addr' && searchState.tsAddr) {
    searchState.tsAddr.destroy();
    searchState.tsAddr = null;
  }
  searchState.activeChip = null;
  searchPage = 1;
  renderSearchTags();
  renderSearchChips();
  renderSearchPanel(null);
  runSearchWithState();
}

function renderSearchChips() {
  var $chips = $('#searchChips');
  if (!searchState.type && !Object.keys(searchState.f).length) {
    $chips.addClass('d-none').css('display', 'none');
    return;
  }
  var typeKey  = searchState.type ? searchState.type.toLowerCase() : 'default';
  var chipsKey = 'default';
  Object.keys(CHIPS_BY_TYPE).forEach(function (k) {
    if (k !== 'default' && typeKey.includes(k)) chipsKey = k;
  });
  var keys = CHIPS_BY_TYPE[chipsKey];
  var html = keys.map(function (k) {
    if (k === 'rent') return renderRentChip();
    var active = searchState.f[k] !== undefined;
    return '<span class="btn btn-sm mr-1 mb-1 ' + (active ? 'btn-primary' : 'btn-outline-primary') + '" ' +
      'onclick="toggleSearchChip(\'' + k + '\')">' +
      (active ? '✓ ' : '+ ') + CHIP_LABELS[k] +
      (active ? ' <span onclick="removeSearchChip(event,\'' + k + '\')">×</span>' : '') +
    '</span>';
  }).join('');
  $chips.html(html).removeClass('d-none').css('display', 'block');
}

function renderRentChip() {
  var rent       = searchState.f.rent;
  var saleActive = rent === '';
  var rentActive = rent === '1';
  return '<span class="btn btn-sm mr-1 mb-1 ' + (saleActive ? 'btn-primary' : 'btn-outline-primary') + '" ' +
    'onclick="applyRent(event,\'\')">' +
    (saleActive ? '✓ ' : '') + 'Продаж' +
    (saleActive ? ' <span onclick="removeSearchChip(event,\'rent\')">×</span>' : '') +
    '</span>' +
    '<span class="btn btn-sm mr-1 mb-1 ' + (rentActive ? 'btn-primary' : 'btn-outline-primary') + '" ' +
    'onclick="applyRent(event,\'1\')">' +
    (rentActive ? '✓ ' : '') + 'Оренда' +
    (rentActive ? ' <span onclick="removeSearchChip(event,\'rent\')">×</span>' : '') +
    '</span>';
}

function applyRent(e, val) {
  e.stopPropagation();
  if (searchState.f.rent === val) {
    delete searchState.f.rent;
  } else {
    searchState.f.rent = val;
  }
  searchPage = 1;
  renderSearchTags();
  renderSearchChips();
  runSearchWithState();
}

function removeSearchChip(e, k) {
  e.stopPropagation();
  removeSearchTag(e, k);
}

function toggleSearchChip(k) {
  searchState.activeChip = (searchState.activeChip === k) ? null : k;
  renderSearchPanel(searchState.activeChip);
}

function renderSearchPanel(k) {
  var $panel = $('#searchFilterPanel');
  if (!k) {
    $panel.addClass('d-none').css('display', 'none').html('');
    if (searchState.tsLoc)  { searchState.tsLoc.destroy();  searchState.tsLoc  = null; }
    if (searchState.tsAddr) { searchState.tsAddr.destroy(); searchState.tsAddr = null; }
    return;
  }
  $panel.removeClass('d-none').css('display', 'block');

  if (k === 'loc') {
    $panel.html('<select id="tsLocSelect" class="form-control form-control-sm"><option value="">Почніть вводити...</option></select>');
    setTimeout(function () {
      if (searchState.tsLoc) { searchState.tsLoc.destroy(); searchState.tsLoc = null; }
      searchState.tsLoc = new TomSelect('#tsLocSelect', {
        options: searchPlaces,
        optgroups: [
          { value: 'Міста',       label: 'Міста' },
          { value: 'Райони',      label: 'Райони' },
          { value: 'Села/Селища', label: 'Села/Селища' },
        ],
        optgroupField: 'group',
        labelField:    'text',
        valueField:    'value',
        searchField:   'text',
        placeholder:   'Введіть назву...',
        maxOptions:    30,
        onChange: function (val) {
          if (val) { searchPage = 1; applySearchSimple('loc', val); }
        }
      });
      if (searchState.f.loc) searchState.tsLoc.setValue(searchState.f.loc, true);
    }, 50);

  } else if (k === 'addr') {
    $panel.html('<select id="tsAddrSelect" class="form-control form-control-sm"><option value="">Почніть вводити...</option></select>');
    setTimeout(function () {
      if (searchState.tsAddr) { searchState.tsAddr.destroy(); searchState.tsAddr = null; }
      searchState.tsAddr = new TomSelect('#tsAddrSelect', {
        options: searchStreets.map(function (s) { return { value: s, text: s }; }),
        labelField:  'text',
        valueField:  'value',
        searchField: 'text',
        placeholder: 'Введіть вулицю...',
        maxOptions:  30,
        onChange: function (val) {
          if (val) { searchPage = 1; applySearchSimple('addr', val); }
        }
      });
      if (searchState.f.addr) searchState.tsAddr.setValue(searchState.f.addr, true);
    }, 50);

  } else if (k === 'rooms') {
    $panel.html(searchRangePanel('rooms',   searchState.f.rooms   || {}, '',    1,  20));
  } else if (k === 'surface') {
    $panel.html(searchRangePanel('surface', searchState.f.surface || {}, 'м²',  10, 2000));
  } else if (k === 'land') {
    $panel.html(searchRangePanel('land',    searchState.f.land    || {}, 'м²',  0,  100000));
  } else if (k === 'floor') {
    $panel.html(searchRangePanel('floor',   searchState.f.floor   || {}, '',    0,  50));
  } else if (k === 'floors') {
    $panel.html(searchRangePanel('floors',  searchState.f.floors  || {}, '',    1,  50));
  } else if (k === 'price') {
    $panel.html(searchRangePanel('price',   searchState.f.price   || {}, '₴',   0,  100000000));
  }
}

function searchRangePanel(key, v, unit, mn, mx) {
  return '<div class="d-flex align-items-center flex-wrap">' +
    '<small class="text-muted mr-1">від</small>' +
    '<input type="number" class="form-control form-control-sm mr-2" style="width:100px" min="' + mn + '" max="' + mx + '" placeholder="мін" value="' + (v.min || '') + '" oninput="applySearchRange(\'' + key + '\',\'min\',this.value)">' +
    '<small class="text-muted mr-1">до</small>' +
    '<input type="number" class="form-control form-control-sm mr-2" style="width:100px" min="' + mn + '" max="' + mx + '" placeholder="макс" value="' + (v.max || '') + '" oninput="applySearchRange(\'' + key + '\',\'max\',this.value)">' +
    (unit ? '<small class="text-muted">' + unit + '</small>' : '') +
  '</div>';
}

function applySearchSimple(k, v) {
  if (v !== '') searchState.f[k] = v;
  else delete searchState.f[k];
  searchPage = 1;
  renderSearchTags();
  renderSearchChips();
  runSearchWithState();
}

function applySearchRange(k, side, v) {
  if (!searchState.f[k] || typeof searchState.f[k] !== 'object') searchState.f[k] = {};
  if (v) searchState.f[k][side] = parseFloat(v);
  else   delete searchState.f[k][side];
  if (!searchState.f[k].min && !searchState.f[k].max) delete searchState.f[k];
  searchPage = 1;
  renderSearchTags();
  renderSearchChips();
  runSearchWithState();
}

function renderResults(items, pagination) {
  var $list = $('#searchResultsList');
  var $wrap = $('#searchResults');

  if (!items.length) {
    $list.html('<p class="text-muted small p-2 mb-0">Нічого не знайдено</p>');
    $wrap.removeClass('d-none').css('display', 'block');
    return;
  }

  var html = items.map(function (item) {
    var url   = '{{ site.url }}' + item.link;
    var addr  = buildAddr(item);
    var rooms = item.rooms        ? item.rooms + ' кімн.'             : '';
    var surf  = item.surface      ? item.surface + ' м²'              : '';
    var land  = item.surface_land ? item.surface_land + ' м² ділянка' : '';
    var floor = (item.floor_int && item.floors_int)
                  ? item.floor_int + '/' + item.floors_int + ' пов.'
                  : (item.floors_int ? item.floors_int + ' пов.' : '');
    var meta  = [rooms, surf, land, floor].filter(Boolean).join(' · ');

    var img = '';
    if (item.images && item.images.length > 0 && item.images[0].src) {
      img = '<div class="pt-2 pr-1">' +
        '<img src="{{ site.url }}' + item.images[0].src + '" ' +
        'alt="' + (item.images[0].alt || '') + '" ' +
        'width="50" height="50" class="rounded">' +
        '</div>';
    }

    return '<a href="' + url + '" class="d-block text-decoration-none border-bottom py-2 px-1 search-result-item">' +
      '<div class="d-flex">' +
        img +
        '<div class="p-2 flex-grow-1">' +
          '<p class="m-0">' +
            '<span class="badge badge-primary mr-1">' + item.type + '</span>' +
            '<small class="text-primary">' + addr + '</small>' +
          '</p>' +
          (meta ? '<span class="d-block"><small class="text-monospace text-body">' + meta + '</small></span>' : '') +
        '</div>' +
        '<div class="pl-1 py-2 text-center" style="min-width:90px;">' +
          formatPrice(item) +
        '</div>' +
      '</div>' +
    '</a>';
  }).join('');

  var total = pagination.total;
  var pages = Math.ceil(total / searchPerPage);
  var pager = '<div class="d-flex justify-content-between align-items-center mt-2 px-1">' +
    '<small class="text-muted">Знайдено: ' + total + '</small>' +
    '<div>';
  if (searchPage > 1) {
    pager += '<button class="btn btn-sm btn-outline-primary mr-1" id="btnPrevPage">← Назад</button>';
  }
  if (searchPage < pages) {
    pager += '<button class="btn btn-sm btn-outline-primary" id="btnNextPage">Далі →</button>';
  }
  pager += '</div></div>';

  $list.html(html + pager);
  $wrap.removeClass('d-none').css('display', 'block');

  $('#btnNextPage').on('click', function (e) {
    e.stopPropagation();
    searchPage++;
    runSearchWithState();
    $('html, body').animate({ scrollTop: $('#searchResults').offset().top - 20 }, 300);
  });
  $('#btnPrevPage').on('click', function (e) {
    e.stopPropagation();
    searchPage--;
    runSearchWithState();
    $('html, body').animate({ scrollTop: $('#searchResults').offset().top - 20 }, 300);
  });
}

function parseQuery(raw) {
  var q = raw.toLowerCase().trim();
  var filters = {};

  for (var i = 0; i < searchTypes.length; i++) {
    if (q.includes(searchTypes[i])) {
      filters.type = [searchTypes[i].charAt(0).toUpperCase() + searchTypes[i].slice(1)];
      break;
    }
  }

  for (var j = 0; j < searchLocations.length; j++) {
    if (q.includes(searchLocations[j])) {
      filters.location_clean = [searchLocations[j]];
      break;
    }
  }

  for (var k = 0; k < searchRegions.length; k++) {
    if (q.includes(searchRegions[k])) {
      filters.region = [searchRegions[k] + ' район'];
      break;
    }
  }

  if (/оренда|здам|зніму/.test(q))  filters.rent = ['1'];
  if (/продаж|продам|куплю/.test(q)) filters.rent = [''];

  return filters;
}