"use strict";
if (!Array.prototype.flatMap) {
  Array.prototype.flatMap = function(fn) {
    var result = [];
    for (var i = 0; i < this.length; i++) {
      var mapped = fn(this[i], i, this);
      if (Array.isArray(mapped)) {
        for (var j = 0; j < mapped.length; j++) {
          result.push(mapped[j]);
        }
      } else {
        result.push(mapped);
      }
    }
    return result;
  };
}
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

  $(document).on('click', '.tel-btn', function(e) {
    e.stopPropagation();
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
      var $link = $('<a>',{href: 'tel:+' + decrypted, title: 'Зателефонуйте мені'});
      $link.on('click', function(e) { e.stopPropagation(); });
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
  $(document).on('post-body.bs.table', function() {
    $('.fixed-table-toolbar .search .search-input').each(function(i) {
      $(this).attr({ id: 'tableSearch' + (i + 1), name: 'tableSearch' });
    });
  });
  var $mainContainer = $('main.content');
  var $originalContent = null;
  var $searchContent = null;
  var searchableRehiony = null;
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
  function initSearchableSelect() {
    if (searchableRehiony) {
      searchableRehiony.destroy();
      searchableRehiony = null;
    }
    var $el = document.getElementById('rehiony');
    if (!$el) return;
    searchableRehiony = new SearchableSelect('#rehiony', {
      maxOptions: 10,
      placeholder: $el.options[0] ? $el.options[0].text : 'Введіть назву...',
      options: [
        {%- for r in site.data.realestate -%}
          {%- if r.url == site.url and r.slug and r.slug != '' -%}
            {%- include select/0.html -%}
          {%- elsif r.slug and r.slug != '' and r.url contains 'https' -%}
            {%- assign d = r.url | remove: 'https://www.realestate.' | remove: '.ua' -%}
            {%- if site.data[d] -%}
              {%- for o in site.data[d] -%}
                {value:"{{ o.url }}",text:"{{ o.title }}"},
              {%- endfor -%}
            {%- endif -%}
          {%- else -%}
            {value:"{{ r.url }}",text:"{{ r.small }}"},
          {%- endif -%}
        {%- endfor -%}
        {value:"/region/{{ site.region_slug }}/",text:"{{ site.region }}"}
      ],
      onChange: function (value) {
        if (value !== '') {
          window.location = value;
        }
      }
    });
  }
  initSearchableSelect();
  $('input[name="searchMode"]').on('change', function () {
    if ($(this).val() === 'loc') {
      $originalContent.removeClass('d-none');
      $searchContent.addClass('d-none');
      $('#searchLoc').removeClass('d-none');
      $('#searchObj').addClass('d-none');
      $('#searchResults').addClass('d-none');
    } else {
      $originalContent.addClass('d-none');
      $searchContent.removeClass('d-none');
      $('#searchLoc').addClass('d-none');
      $('#searchObj').removeClass('d-none');
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
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
function SearchableSelect(el, opts) {
  var settings = {
    options: opts.options || [],
    placeholder: opts.placeholder || '',
    onChange: opts.onChange || function() {}
  };
  var maxOptions = opts.maxOptions || 10;

  var $original = (typeof el === 'string') ? document.querySelector(el) : el;
  if (!$original) return null;

  var self = this;
  var currValue = '';
  var isOpen = false;
  var focusIdx = -1;

  $original.style.display = 'none';

  var wrapper = document.createElement('div');
  wrapper.style.position = 'relative';

  var inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'form-control';
  inp.placeholder = settings.placeholder;
  inp.autocomplete = 'off';
  inp.name = $original.id || 'searchable-' + Math.random().toString(36).slice(2, 8);

  var clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn-clear';
  clearBtn.textContent = '\u00d7';
  clearBtn.onclick = function(e) {
    e.stopPropagation();
    self.clear();
    inp.focus();
  };

  var dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu searchable-dropdown';
  dropdown.style.cssText = 'width:100%;max-height:300px;overflow-y:auto;position:absolute;display:none;';

  wrapper.appendChild(inp);
  wrapper.appendChild(clearBtn);
  wrapper.appendChild(dropdown);
  $original.parentNode.insertBefore(wrapper, $original.nextSibling);

  function filtered(q) {
    var query = q.toLowerCase().trim();
    var result = [];
    var i, item;
    for (i = 0; i < settings.options.length; i++) {
      if (result.length >= maxOptions) break;
      item = settings.options[i];
      if (!query || item.text.toLowerCase().indexOf(query) !== -1) {
        result.push(item);
      }
    }
    return result;
  }

  function render(q) {
    var items = filtered(q);
    if (items.length === 0) {
      dropdown.innerHTML = '<span class="dropdown-item-text text-muted px-3">\u0417\u0430 \u0446\u0438\u043c \u0437\u0430\u043f\u0438\u0442\u043e\u043c "' + escapeHtml(q.trim()) + '" \u043d\u0456\u0447\u043e\u0433\u043e \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e</span>';
    } else {
      var html = '';
      var i, item, active;
      for (i = 0; i < items.length; i++) {
        item = items[i];
        active = item.value === currValue ? ' active' : '';
        html += '<button type="button" class="dropdown-item' + active + '" data-value="' + item.value.replace(/"/g, '&quot;') + '">' + item.text.replace(/</g, '&lt;') + '</button>';
      }
      dropdown.innerHTML = html;
    }
    focusIdx = -1;
  }

  function open() {
    if (!isOpen) {
      isOpen = true;
      dropdown.classList.add('show');
      dropdown.style.display = 'block';
      render(inp.value);
    }
  }

  function close() {
    if (isOpen) {
      isOpen = false;
      dropdown.classList.remove('show');
      dropdown.style.display = 'none';
    }
  }

  function findItem(val) {
    var i;
    for (i = 0; i < settings.options.length; i++) {
      if (settings.options[i].value === val) return settings.options[i];
    }
    return null;
  }

  function pick(val) {
    if (val === currValue) { close(); return; }
    currValue = val;
    if (val) {
      var item = findItem(val);
      inp.value = item ? item.text : val;
    } else {
      inp.value = '';
    }
    toggleClear();
    close();
    settings.onChange(val);
  }

  this.setValue = function(val, silent) {
    currValue = val;
    if (val) {
      var item = findItem(val);
      inp.value = item ? item.text : val;
    } else {
      inp.value = '';
    }
    toggleClear();
    if (!silent) settings.onChange(val);
  };

  this.getValue = function() { return currValue; };

  this.clear = function() {
    this.setValue('');
    render('');
    open();
  };

  this.destroy = function() {
    close();
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    $original.style.display = '';
  };

  function toggleClear() {
    clearBtn.style.display = inp.value ? 'block' : 'none';
  }

  inp.addEventListener('input', function() {
    var q = inp.value;
    if (!q && currValue) {
      self.clear();
      return;
    }
    render(q);
    open();
    toggleClear();
  });

  inp.addEventListener('focus', open);

  inp.addEventListener('click', function(e) {
    e.stopPropagation();
    open();
  });

  document.addEventListener('click', function(e) {
    if (!wrapper.contains(e.target)) close();
  });

  inp.addEventListener('keydown', function(e) {
    var items = dropdown.querySelectorAll('.dropdown-item');
    var code = e.which || e.keyCode;
    var i;

    if (code === 40) {
      e.preventDefault();
      focusIdx = Math.min(focusIdx + 1, items.length - 1);
      for (i = 0; i < items.length; i++) {
        if (i === focusIdx) {
          items[i].classList.add('active');
        } else {
          items[i].classList.remove('active');
        }
      }
    } else if (code === 38) {
      e.preventDefault();
      focusIdx = Math.max(focusIdx - 1, -1);
      for (i = 0; i < items.length; i++) {
        if (i === focusIdx) {
          items[i].classList.add('active');
        } else {
          items[i].classList.remove('active');
        }
      }
    } else if (code === 13) {
      e.preventDefault();
      if (focusIdx >= 0 && focusIdx < items.length) {
        items[focusIdx].click();
      }
    } else if (code === 27) {
      close();
      inp.blur();
    }
  });

  dropdown.addEventListener('click', function(e) {
    var item = e.target.closest('.dropdown-item');
    if (item && item.dataset.value !== undefined) {
      pick(item.dataset.value);
    }
  });
}
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
        var firstPart = (item.address || '').split(',')[0].replace(/\s*\([^)]*\)/g, '').trim();
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

      if (typeof itemsjs !== 'function') {
        console.warn('itemsjs не завантажено');
        callback();
        return;
      }
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
    $chips.addClass('d-none');
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
  $chips.html(html).removeClass('d-none');
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

function renderSearchPanel(k) {
  var $panel = $('#searchFilterPanel');
  if (!k) {
    $panel.addClass('d-none').html('');
    if (searchState.tsLoc)  { searchState.tsLoc.destroy();  searchState.tsLoc  = null; }
    if (searchState.tsAddr) { searchState.tsAddr.destroy(); searchState.tsAddr = null; }
    return;
  }
  $panel.removeClass('d-none');
  if (k === 'loc') {
    $panel.html('<div id="tsLocSelect"></div>');
    setTimeout(function () {
      if (searchState.tsLoc) { searchState.tsLoc.destroy(); searchState.tsLoc = null; }
      searchState.tsLoc = new SearchableSelect('#tsLocSelect', {
        options:    searchPlaces,
        placeholder: 'Введіть назву...',
        maxOptions: 30,
        onChange: function (val) {
          if (val) { searchPage = 1; applySearchSimple('loc', val); }
        }
      });
      if (searchState.f.loc) searchState.tsLoc.setValue(searchState.f.loc, true);
    }, 50);
  } else if (k === 'addr') {
    $panel.html('<div id="tsAddrSelect"></div>');
    setTimeout(function () {
      if (searchState.tsAddr) { searchState.tsAddr.destroy(); searchState.tsAddr = null; }
      searchState.tsAddr = new SearchableSelect('#tsAddrSelect', {
        options:    searchStreets.map(function (s) { return { value: s, text: s }; }),
        placeholder: 'Введіть вулицю...',
        maxOptions: 30,
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
  return '<div class="form-row">' +
    '<div class="col">' +
      '<input type="number" class="form-control form-control-sm" placeholder="від" ' +
        'name="' + key + '_min" ' +
        'oninput="applySearchRange(\'' + key + '\', \'min\', this.value)" value="' + (v.min || '') + '">' +
    '</div>' +
    '<div class="col">' +
      '<input type="number" class="form-control form-control-sm" placeholder="до" ' +
        'name="' + key + '_max" ' +
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
    $wrap.removeClass('d-none');
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
  $wrap.removeClass('d-none');
  $(document).off('click', '#btnNextPage');
  $(document).off('click', '#btnPrevPage');
  $(document).on('click', '#btnNextPage', function (e) {
    e.stopPropagation();
    searchPage++;
    runSearchWithState();
    var $target = $('#collapseAreaSelect');
    if ($target.length) {
      var t = $target.offset().top - 20;
      $('html, body').animate({ scrollTop: t }, 300);
    }
  });
  $(document).on('click', '#btnPrevPage', function (e) {
    e.stopPropagation();
    searchPage--;
    runSearchWithState();
    var $target = $('#collapseAreaSelect');
    if ($target.length) {
      var t = $target.offset().top - 20;
      $('html, body').animate({ scrollTop: t }, 300);
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
    var t = $target.offset().top - 20;
    $('html, body').animate({ scrollTop: t }, 300);
  }
}