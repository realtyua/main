"use strict";
$(document).ready(function () {
  $("body").tooltip({ selector: '[data-toggle="tooltip"]' });
  $('[data-toggle="popover"]').popover();

  var phoneCache = null;
  function drawPlaceholder(canvas) {
    var ctx = canvas.getContext('2d');
    var fontSize = 16;
    ctx.font = fontSize + 'px -apple-system, "Source Sans Pro", "Open Sans", sans-serif';
    var text = '+38 XXX XXX XX XX';
    var metrics = ctx.measureText(text);
    var textWidth = metrics.width;
    var padding = 0;
    canvas.width = Math.ceil(textWidth) + (padding * 2);
    canvas.height = fontSize + 10;
    ctx.font = fontSize + 'px -apple-system, "Source Sans Pro", "Open Sans", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2d5ca6';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillText(text, padding, fontSize - 1);
  }
  function getBasePathForData() {
    var path = window.location.pathname;
    var parts = path.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    if (parts[0] === 'region' && parts[1] === 'city' && parts[2]) {
      return '/' + parts.slice(0, 3).join('/');
    }
    if (parts[0] === 'region' && parts[1] && parts[1] !== 'city') {
      return '/' + parts.slice(0, 2).join('/');
    }
    if (parts[0] === 'district' && parts[1] === 'town' && parts[2]) {
      return '/' + parts.slice(0, 3).join('/');
    }
    if (parts[0] === 'district' && parts[1] && parts[1] !== 'town') {
      return '/' + parts.slice(0, 2).join('/');
    }
    return null;
  }
  function decryptPhone(encrypted) {
    if (!encrypted) return '';
    var clean = encrypted.replace(/\D/g, '');
    var prefix = clean.slice(0, 3);
    var encPart = clean.slice(3);
    var decryptedPart = encPart.split('').map(function(c) {
      var n = parseInt(c, 10) - 1;
      return n < 0 ? 9 : n;
    }).join('');
    return prefix + decryptedPart;
  }
  function formatPhone(phone) {
    return '+' + phone.slice(0, 2) + ' ' + phone.slice(2, 5) + ' ' + phone.slice(5, 8) + ' ' + phone.slice(8, 10) + ' ' + phone.slice(10);
  }

  function loadPhoneData(callback) {
    if (phoneCache) { callback(phoneCache); return; }
    var basePath = getBasePathForData();
    if (!basePath) {
      console.warn('Не вдалося визначити шлях до *.json');
      callback({});
      return;
    }
    var jsonUrl = basePath + '/data/all.json';
    fetch(jsonUrl)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(data) {
        phoneCache = {};
        (data || []).forEach(function(item) {
          if (item.id && item.phone) {
            phoneCache[item.id] = item.phone;
          }
        });
        callback(phoneCache);
      })
      .catch(function(e) {
        console.error('Phone load error:', e);
        callback({});
      });
  }

  $(document).on('click', '.tel-btn', function() {
    var $btn = $(this);
    var $canvas = $btn.find('canvas');
    if ($btn.data('revealed')) return;
    var id = $btn.data('id');
    
    loadPhoneData(function(phones) {
      var encrypted = phones[id];
      var decrypted = decryptPhone(encrypted);
      if (!decrypted) return;
      var canvasEl = $canvas[0];
      var ctx = canvasEl.getContext('2d');
      var fontSize = 16;
      ctx.font = fontSize + 'px -apple-system, "Source Sans Pro", "Open Sans", sans-serif';
      var phoneText = formatPhone(decrypted);
      var metrics = ctx.measureText(phoneText);
      var textWidth = metrics.width;
      var padding = 0;
      canvasEl.width = Math.ceil(textWidth) + (padding * 2);
      canvasEl.height = fontSize + 10;
      ctx.font = fontSize + 'px -apple-system, "Source Sans Pro", "Open Sans", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2d5ca6';
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.fillText(phoneText, padding, fontSize - 1);
      var $link = $('<a>',{href: 'tel:' + decrypted, title: 'Телефон'});
      $btn.wrap($link).parent();
      $btn.data('revealed', true);
    });
  });

  $(document).ready(function() {
    $('.tel-canvas').each(function() {drawPlaceholder(this);});
  });

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
  var $mainContainer = $('main.content');
  var $originalContent = null;
  var $searchContent = null;
  var tomSelectInstance = null;
  function wrapOriginalContent() {
    if ($mainContainer.children('.original-content-wrapper').length) {
      $originalContent = $mainContainer.children('.original-content-wrapper');
      return;
    }
    var $wrapper = $('<div class="original-content-wrapper"></div>');
    var $children = $mainContainer.children();
    $wrapper.insertBefore($children.first());
    $wrapper.append($children);
    $originalContent = $wrapper;
  }
  function createSearchContent() {
    if ($searchContent && $searchContent.length) return;
    $searchContent = $(
      '<div class="search-content-wrapper d-none">' +
        '<div class="container">' +
          '<div class="row">' +
            '<div class="col-md-8 offset-md-2">' +
              '<div id="searchResults" class="d-none mt-3">' +
                '<div id="searchResultsList"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    $mainContainer.append($searchContent);
  }
  wrapOriginalContent();
  createSearchContent();
  function initTomSelect() {
    if (tomSelectInstance) {
      tomSelectInstance.destroy();
      tomSelectInstance = null;
    }
    var $el = document.getElementById('rehiony');
    if (!$el) return;
    tomSelectInstance = new TomSelect('#rehiony', {
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
        {url:"/region/{{ site.region_slug }}/",title:"{{ site.region }}"}
      ],
      render: {
        no_results: function (data, escape) {
          return '<div class="dropdown-item">За цим запитом "' + escape(data.input) + '" нічого не знайдено</div>';
        }
      },
      onChange: function (value) {
        if (value !== '') {
          window.location = value;
        }
      }
    });
  }
  initTomSelect();
  $('input[name="searchMode"]').on('change', function () {
    if ($(this).val() === 'loc') {
      $originalContent.removeClass('d-none').css('display', 'block');
      $searchContent.addClass('d-none').css('display', 'none');
      $('#searchLoc').removeClass('d-none').css('display', 'block');
      $('#searchObj').addClass('d-none').css('display', 'none');
      $('#searchResults').addClass('d-none').css('display', 'none');
    } else {
      $originalContent.addClass('d-none').css('display', 'none');
      $searchContent.removeClass('d-none').css('display', 'block');
      $('#searchLoc').addClass('d-none').css('display', 'none');
      $('#searchObj').removeClass('d-none').css('display', 'block');
      setTimeout(function () {
        $('#searchListings').focus();
      }, 50);
      loadSearchEngine(function () {
        searchState.f = {};
        searchState.type = null;
        searchState.sort = null;
        searchPage = 1;
        renderSearchTags();
        renderSearchChips();
        runSearchWithState();
      });
    }
  });
  $('#searchListings').on('input', function () {
    var query = $(this).val().trim().toLowerCase();
    if (query.length < 1) return;
    loadSearchEngine(function () {
      var matched = null;
      for (var i = 0; i < TYPE_GROUPS.length; i++) {
        var group = TYPE_GROUPS[i];
        for (var j = 0; j < group.triggers.length; j++) {
          if (query.includes(group.triggers[j])) {
            matched = group;
            break;
          }
        }
        if (matched) break;
      }
      if (matched && searchState.f['type'] !== matched.tag) {
        searchState.type      = matched.tag;
        searchState.f['type'] = matched.tag;
        $('#searchListings').val('');
        renderSearchTags();
        renderSearchChips();
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
var TS_RENDER = {
  no_results: function (data, escape) {
    return '<div class="dropdown-item">За цим запитом "' + escape(data.input) + '" нічого не знайдено</div>';
  }
};
var TYPE_GROUPS = [
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
    triggers: ['нежитлове приміщення', 'комерційне приміщення', 'приміщення'],
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
var DEFAULT_CHIPS = ['rent','loc','addr','surface','land','price'];
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
var searchEngine      = null;
var searchLocations   = [];
var searchRegions     = [];
var searchTypes       = [];
var searchPlaces      = [];
var searchStreets     = [];
var searchPage        = 1;
var searchPerPage     = 9;
var searchLastFilters = {};
var searchPlaceTypes  = {};
var nbuRates = { USD: {{ site.usd }}, EUR: {{ site.eur }} };
var NON_STREET_PREFIXES = [
  'с.', 'с.м.т.', 'смт', 'село ', 'селище ',
  'c.', 'C.',
  'присілок', 'урочище', 'масив ', 'мікрорайон', 'мікро район',
  'садове товариство', 'садівниче товариство',
  'дачне селище', 'поселення '
];
var searchState = { type: null, activeChip: null, f: {}, tsLoc: null, tsAddr: null, sort: null };
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
function getTypeGroup(tag) {
  for (var i = 0; i < TYPE_GROUPS.length; i++) {
    if (TYPE_GROUPS[i].tag === tag) return TYPE_GROUPS[i];
  }
  return null;
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
function formatPriceUAH(item) {
  var price    = String(item.price     || '').trim();
  var priceSqm = String(item.price_sqmt || '').trim();
  var isRent   = item.rent === '1';
  if (isRent && !price && priceSqm) {
    var num = parseInt(priceSqm);
    if (!isNaN(num)) {
      return {
        uah:  num.toLocaleString('uk-UA') + '₴/доба',
        orig: ''
      };
    }
  }
  if (!price) return null;
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
  if (isNaN(uah) || uah === 0) return null;
  return {
    uah:  Math.round(uah).toLocaleString('uk-UA').replace(/,/g, '\u00a0') + '₴',
    orig: orig
  };
}
function updateSearchPlaceholder() {
  var input   = document.getElementById('searchListings');
  var hasTags = Object.keys(searchState.f).length > 0;
  input.placeholder = hasTags ? '' : 'будинок, квартира, земля...';
}
function loadSearchEngine(callback) {
  if (searchEngine) { callback(); return; }
    fetch('/region/{{ site.region_slug }}/data/all.json')
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
        var firstPart = (item.address || '').split(',')[0].replace(/\s*\(неподалік\)|\s*\(поруч\)/gi, '').trim();
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
      searchStreets = [...new Set(
        data.map(function (i) { return i.street; }).filter(Boolean)
      )].sort(function (a, b) { return a.localeCompare(b, 'uk'); });

      var villages = [];
      data.forEach(function (item) {
        var addr = item.address || '';
        var normalized = addr.replace(/\bc\./g, 'с.');
        var matches = normalized.match(/с\.м?\.?т?\.?\s+[^,]+/g);
        if (matches) {
          villages = villages.concat(matches.map(function (v) { return v.trim(); }));
        }
      });
      var searchVillages = [...new Set(villages)];
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
function matchType(itemType, tag) {
  var group = getTypeGroup(tag);
  if (!group) return false;
  var t = (itemType || '').toLowerCase();
  for (var i = 0; i < group.filters.length; i++) {
    if (t.includes(group.filters[i].toLowerCase())) return true;
  }
  return false;
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
  var addr = (item.address || '').replace(/\bc./g, 'с.').toLowerCase();
  return addr.includes(locVal.toLowerCase());
}
function buildAddr(item) {
  var parts = [];
  if (item.location) {
    parts.push('м. ' + capitalize(item.location.replace('м. ', '').trim()));
  } else if (item.region) {
    parts.push(capitalize(item.region.replace(' район', '').trim()) + ' район');
  }
  if (item.address) parts.push(item.address);
  return parts.join(', ');
}
function runSearchWithState() {
  if (!searchEngine) return;
  var allItems = searchEngine.search({ filters: {}, per_page: 9999, page: 1 }).data.items;
  var items = allItems.filter(function (item) {
    if (searchState.f.type && !matchType(item.type, searchState.f.type)) return false;
    if (searchState.f.rent !== undefined && item.rent !== searchState.f.rent) return false;
    if (searchState.f.loc && !matchLoc(item, searchState.f.loc)) return false;
    if (searchState.f.addr && item.street !== searchState.f.addr) return false;
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
  if (searchState.sort === 'desc') {
    items.sort(function (a, b) { return (b.price_uah || 0) - (a.price_uah || 0); });
  } else if (searchState.sort === 'asc') {
    items.sort(function (a, b) { return (a.price_uah || 0) - (b.price_uah || 0); });
  }
  var total     = items.length;
  var start      = (searchPage - 1) * searchPerPage;
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
    return '<span class="badge badge-primary mr-1 mb-1" style="cursor:pointer;" onclick="removeSearchTag(event,\'' + k + '\')">' +
      searchTagLabel(k, searchState.f[k]) +
      ' ×' +
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
  var group = getTypeGroup(searchState.type);
  var keys  = group ? group.chips : DEFAULT_CHIPS;
  var html  = keys.map(function (k) {
    if (k === 'rent') return renderRentChip();
    var active = searchState.f[k] !== undefined;
    return '<span class="btn btn-sm mr-1 mb-1 ' + (active ? 'btn-primary' : 'btn-outline-primary') + '" ' +
      'onclick="toggleSearchChip(\'' + k + '\')">' +
      (active ? '✓ ' : '+ ') + CHIP_LABELS[k] +
      (active ? ' ×' : '') +
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
    (saleActive ? '  × ' : '') +
  '</span>' +
  '<span class="btn btn-sm mr-1 mb-1 ' + (rentActive ? 'btn-primary' : 'btn-outline-primary') + '" ' +
    'onclick="applyRent(event,\'1\')">' +
    (rentActive ? '✓ ' : '') + 'Оренда' +
    (rentActive ? '  × ' : '') +
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
function addClearButton(ts) {
  if (!ts || !ts.control) return;
  if (!document.getElementById('ts-clear-btn-fix')) {
    var style = document.createElement('style');
    style.id = 'ts-clear-btn-fix';
    style.textContent = `.clear-button { display:none; position:absolute;right:10px;top:50%;transform:translateY(-50%); width:20px;height:20px;line-height:20px;text-align:center; cursor:pointer;font-size:18px;color:#666;z-index:5; } .ts-wrapper.has-items .ts-control .clear-button{display:block!important;}`;
    document.head.appendChild(style);
  }
  var button = document.createElement('div');
  button.className = 'clear-button';
  button.innerHTML = '×';
  button.title = 'Очистити';
  button.addEventListener('click', function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    ts.clear();
  });
  ts.control.style.position = 'relative';
  ts.control.appendChild(button);
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
    $panel.html('<select id="tsLocSelect" placeholder="Введіть назву..."></select>');
    setTimeout(function () {
      if (searchState.tsLoc) { searchState.tsLoc.destroy(); searchState.tsLoc = null; }
      searchState.tsLoc = new TomSelect('#tsLocSelect', {
        options:      searchPlaces,
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
        render:        TS_RENDER,
        onChange: function (val) {
          if (val) { searchPage = 1; applySearchSimple('loc', val); }
        },
        onInitialize: function() { addClearButton(this); }
      });
      if (searchState.f.loc) searchState.tsLoc.setValue(searchState.f.loc, true);
    }, 50);
  } else if (k === 'addr') {
    $panel.html('<select id="tsAddrSelect" placeholder="Введіть вулицю..."></select>');
    setTimeout(function () {
      if (searchState.tsAddr) { searchState.tsAddr.destroy(); searchState.tsAddr = null; }
      searchState.tsAddr = new TomSelect('#tsAddrSelect', {
        options:     searchStreets.map(function (s) { return { value: s, text: s }; }),
        labelField:  'text',
        valueField:  'value',
        searchField: 'text',
        placeholder: 'Введіть вулицю...',
        maxOptions:  30,
        render:      TS_RENDER,
        onChange: function (val) {
          if (val) { searchPage = 1; applySearchSimple('addr', val); }
        },
        onInitialize: function() { addClearButton(this); }
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
  return '<div class="form-row">' +
    '<div class="col">' +
      '<input type="number" class="form-control form-control-sm" placeholder="від" ' +
        'oninput="applySearchRange(\'' + key + '\', \'min\', this.value)" value="' + (v.min || '') + '">' +
    '</div>' +
    '<div class="col">' +
      '<input type="number" class="form-control form-control-sm" placeholder="до" ' +
        'oninput="applySearchRange(\'' + key + '\', \'max\', this.value)" value="' + (v.max || '') + '">' +
    '</div>' +
    (unit ? '<div class="col-auto"><span class="form-control-plaintext">' + unit + '</span></div>' : '') +
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
    $list.html('<div class="alert alert-info">Нічого не знайдено. Будь ласка спробуйте ще раз, не поспішаючи.</div>');
    $wrap.removeClass('d-none').css('display', 'block');
    return;
  }
  var html = items.map(function (item) {
    var url   = item.link;
    var addr  = buildAddr(item);
    var rooms = item.rooms        ? item.rooms + ' кімн.'             : '';
    var surf  = item.surface      ? item.surface + ' м²'              : '';
    var land  = item.surface_land ? item.surface_land + ' м² ділянка' : '';
    var floor = (item.floor_int && item.floors_int)
      ? item.floor_int + '/' + item.floors_int + ' пов.'
      : (item.floors_int ? item.floors_int + ' пов.' : '');
    var meta  = [rooms, surf, land, floor].filter(Boolean).join(' · ');
    var priceData = formatPriceUAH(item);
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
    if (hasImg) {
      return '<div class="card mb-3">' +
        '<div class="row no-gutters">' +
          '<div class="col-auto col-md-4">' +
            '<img loading="lazy" src="' + item.images[0].src + '" ' +
            'width="100%" height="100%" ' +
            'alt="' + (item.images[0].alt || '') + '" ' +
            'style="object-fit:cover;">' +
          '</div>' +
          '<div class="col-md">' +
            '<div class="card-body">' +
              '<p class="card-title h5 mb-1 font-weight-bold">' +
                '<a href="' + url + '" class="stretched-link">' + item.type + '</a>' +
                ' → <span class="text-muted">' + (item.rent === '1' ? 'оренда' : 'продаж') + '</span>' +
              '</p>' +
              '<p class="card-text mb-1">' + addr + '</p>' +
              (meta ? '<p class="card-text mb-1 text-monospace">' + meta + '</p>' : '') +
              priceHtml +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    } else {
      return '<div class="card mb-3">' +
        '<div class="row no-gutters">' +
          '<div class="col-md">' +
            '<div class="card-body">' +
              '<p class="card-title h5 mb-1 font-weight-bold">' +
                '<a href="' + url + '" class="stretched-link">' + item.type + '</a>' +
                ' → <span class="text-muted">' + (item.rent === '1' ? 'оренда' : 'продаж') + '</span>' +
              '</p>' +
              '<p class="card-text mb-1">' + addr + '</p>' +
              (meta ? '<p class="card-text mb-1 text-monospace">' + meta + '</p>' : '') +
              priceHtml +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
  }).join('');
  var total = pagination.total;
  var pages = Math.ceil(total / searchPerPage);
  var topPager = '<div class="row justify-content-between mb-3">' +
    '<div class="col-md-auto align-self-center">' +
      '<span class="text-muted">Показано ' + searchPage + ' сторінку з ' + pages + '</span>' +
    '</div>' +
    '<div class="col-md-auto">' +
      '<div class="row justify-content-between">' +
        '<div class="col-5 col-md-auto align-self-center">Знайдено: ' + total + '</div>' +
        '<div class="col-auto">' +
          '<div class="btn-group btn-group-sm" role="group">' +
            '<button type="button" class="btn btn-outline-secondary' + (searchState.sort === 'desc' ? ' active' : '') + '" onclick="setSortPrice(\'desc\', event)">Ціна ↓</button>' +
            '<button type="button" class="btn btn-outline-secondary' + (searchState.sort === 'asc' ? ' active' : '') + '" onclick="setSortPrice(\'asc\', event)">Ціна ↑</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
  var bottomPager = '<div class="row justify-content-between mb-3 mt-3">' +
    '<div class="col-md-auto align-self-center">' +
      '<span class="text-muted">Показано ' + searchPage + ' сторінку з ' + pages + '</span>' +
    '</div>' +
    '<div class="col-md-auto">';
  if (searchPage > 1) {
    bottomPager += '<button id="btnPrevPage" class="btn btn-sm btn-outline-primary mr-2">← Назад</button>';
  }
  if (searchPage < pages) {
    bottomPager += '<button id="btnNextPage" class="btn btn-sm btn-outline-primary">Далі →</button>';
  }
  bottomPager += '</div></div>';
  $list.html(topPager + html + (pages > 1 ? bottomPager : ''));
  $wrap.removeClass('d-none').css('display', 'block');
  $(document).off('click', '#btnNextPage');
  $(document).off('click', '#btnPrevPage');
  $(document).on('click', '#btnNextPage', function (e) {
    e.stopPropagation();
    searchPage++;
    runSearchWithState();
    var $target = $('#collapseAreaSelect');
    if ($target.length) {
      $('html, body').animate({ scrollTop: $target.offset().top - 20 }, 300);
    }
  });
  $(document).on('click', '#btnPrevPage', function (e) {
    e.stopPropagation();
    searchPage--;
    runSearchWithState();
    var $target = $('#collapseAreaSelect');
    if ($target.length) {
      $('html, body').animate({ scrollTop: $target.offset().top - 20 }, 300);
    }
  });
}
function parseQuery(raw) {
  var q = raw.toLowerCase().trim();
  var filters = {};
  for (var i = 0; i < searchLocations.length; i++) {
    if (q.includes(searchLocations[i])) {
      filters.location_clean = [searchLocations[i]];
      break;
    }
  }
  for (var j = 0; j < searchRegions.length; j++) {
    if (q.includes(searchRegions[j])) {
      filters.region = [searchRegions[j] + ' район'];
      break;
    }
  }
  if (/оренда|здам|зніму/.test(q))  filters.rent = ['1'];
  if (/продаж|продам|куплю/.test(q)) filters.rent = [''];
  return filters;
}
function setSortPrice(order, e) {
  if (e) e.stopPropagation();
  if (searchState.sort === order) {
    searchState.sort = null;
  } else {
    searchState.sort = order;
  }
  searchPage = 1;
  runSearchWithState();
  var $target = $('#collapseAreaSelect');
  if ($target.length) {
    $('html, body').animate({ scrollTop: $target.offset().top - 20 }, 300);
  }
}