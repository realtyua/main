var RE = window.RE = window.RE || {};

(function(RE) {
  'use strict';

  RE.REGION_SLUG = '{{ site.region_slug }}';
  RE.NBU_RATES = { USD: {{ site.usd }}, EUR: {{ site.eur }} };
  RE.SEARCH_PER_PAGE = 9;

  RE.NON_STREET_PREFIXES = [
    'с.', 'с.м.т.', 'смт', 'село ', 'селище ',
    'c.', 'C.',
    'присілок', 'урочище', 'масив ', 'мікрорайон', 'мікро район',
    'садове товариство', 'садівниче товариство',
    'дачне селище', 'поселення '
  ];

  RE.searchEngine    = null;
  RE.searchLocations = [];
  RE.searchRegions   = [];
  RE.searchTypes     = [];
  RE.searchPlaces    = [];
  RE.searchStreets   = [];
  RE.searchPage      = 1;
  RE.searchLastFilters = {};
  RE.searchPlaceTypes  = {};
  RE.searchAddrOriginals = {};
  RE.phoneCache        = null;
  RE.searchableRehiony = null;

  RE.searchState = { type: null, activeChip: null, f: {}, tsLoc: null, tsAddr: null, sort: null };

  RE.escapeHtml = function(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };

  RE.capitalize = function(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  RE.transliterate = function(str) {
    if (!str) return '';
    var map = {
      'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ie',
      'ж':'zh','з':'z','и':'y','і':'i','ї':'i','й':'i','к':'k','л':'l',
      'м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u',
      'ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch',
      'ь':'','ю':'iu','я':'ia',
      '\'':'','’':'','ʼ':''
    };
    return str.toLowerCase().split('').map(function(c) { return map[c] !== undefined ? map[c] : c; }).join('').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  RE.normalizeCyrillic = function(str) {
    if (!str) return '';
    var map = { 'i':'і','o':'о','a':'а','e':'е','c':'с','p':'р','x':'х', 'y':'у',
                'I':'І','O':'О','A':'А','E':'Е','C':'С','P':'Р','X':'Х', 'Y':'У' };
    return str.split('').map(function(c) { return map[c] !== undefined ? map[c] : c; }).join('');
  };

  RE.isNonStreet = function(str) {
    var s = str.trim();
    for (var i = 0; i < RE.NON_STREET_PREFIXES.length; i++) {
      if (s.toLowerCase().startsWith(RE.NON_STREET_PREFIXES[i].toLowerCase())) return true;
    }
    return false;
  };

  RE.priceToUAH = function(priceStr) {
    if (!priceStr) return 0;
    var s = String(priceStr).trim();
    if (s.startsWith('$')) return parseInt(s.slice(1)) * RE.NBU_RATES.USD;
    if (s.startsWith('€')) return parseInt(s.slice(1)) * RE.NBU_RATES.EUR;
    return parseInt(s) || 0;
  };

  RE.inputPriceToUAH = function(val) {
    return parseFloat(val);
  };

  RE.formatPriceUAH = function(item) {
    var price    = String(item.price     || '').trim();
    var priceSqm = String(item.price_sqmt || '').trim();
    var isRent   = item.rent === '1';
    if (isRent && !price && priceSqm) {
      var num = parseInt(priceSqm);
      if (!isNaN(num)) {
        return { uah: num.toLocaleString('uk-UA') + '₴/доба', orig: '' };
      }
    }
    if (!price) return null;
    var uah  = 0;
    var orig = '';
    if (price.startsWith('$')) {
      uah  = parseInt(price.slice(1)) * RE.NBU_RATES.USD;
      orig = price;
    } else if (price.startsWith('€')) {
      uah  = parseInt(price.slice(1)) * RE.NBU_RATES.EUR;
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
  };

  RE.decryptPhone = function(encrypted) {
    if (!encrypted) return '';
    var clean = encrypted.replace(/\D/g, '');
    var prefix = clean.slice(0, 3);
    var encPart = clean.slice(3);
    var decryptedPart = encPart.split('').map(function(c) {
      var n = parseInt(c, 10) - 1;
      return n < 0 ? 9 : n;
    }).join('');
    return prefix + decryptedPart;
  };

  RE.formatPhone = function(phone) {
    return '+' + phone.slice(0, 2) + ' ' + phone.slice(2, 5) + ' ' + phone.slice(5, 8) + ' ' + phone.slice(8, 10) + ' ' + phone.slice(10);
  };

  RE.drawCanvasText = function(canvas, fontSize, text, color) {
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
  };

  RE.drawPlaceholder = function(canvas) {
    RE.drawCanvasText(canvas, 16, '+38 XXX XXX XX XX', '#2d5ca6');
  };

  RE.drawLoading = function(canvas) {
    RE.drawCanvasText(canvas, 14, 'Завантаження...', '#6c757d');
  };

  RE.drawPhoneError = function(canvas) {
    RE.drawCanvasText(canvas, 16, 'Помилка...', '#dc3545');
  };

  RE.revealPhone = function($btn, $canvas, encrypted) {
    var decrypted = RE.decryptPhone(encrypted);
    if (!decrypted) { RE.drawPhoneError($canvas[0]); return; }
    RE.drawCanvasText($canvas[0], 16, RE.formatPhone(decrypted), '#2d5ca6');
    var $link = $('<a>', { href: 'tel:+' + decrypted, title: 'Зателефонуйте мені' });
    $link.on('click', function(e) { e.stopPropagation(); });
    $btn.wrap($link).parent();
    $btn.data('revealed', true);
    $btn.removeAttr('title');
  };

  RE.loadPhoneCache = function(callback) {
    if (RE.phoneCache) { callback(RE.phoneCache); return; }
    if (!RE.REGION_SLUG) {
      console.warn('regionSlug не визначено');
      callback({});
      return;
    }
    var jsonUrl = '/region/' + RE.REGION_SLUG + '/data/all.json';
    fetch(jsonUrl)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(data) {
        RE.phoneCache = {};
        (data || []).forEach(function(item) {
          if (item.id && item.phone) {
            RE.phoneCache[item.id] = item.phone;
          }
        });
        callback(RE.phoneCache);
      })
      .catch(function(e) {
        console.error('Phone load error:', e);
        callback({});
      });
  };

  RE.getBasePathForData = function() {
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
  };

  RE.updateSearchPlaceholder = function() {
    var input = document.getElementById('searchListings');
    var hasTags = Object.keys(RE.searchState.f).length > 0;
    if (input) input.placeholder = hasTags ? '' : 'будинок, квартира, земля...';
  };

  RE.getTypeGroup = function(tag) {
    for (var i = 0; i < RE.TYPE_GROUPS.length; i++) {
      if (RE.TYPE_GROUPS[i].tag === tag) return RE.TYPE_GROUPS[i];
    }
    return null;
  };

  RE.sShare = { show: function(url, windowHeight, windowWidth) {
    var height = windowHeight || 420;
    var width  = windowWidth || 550;
    var top  = (window.screen.height / 2) - (height / 2);
    var left = (window.screen.width / 2) - (width / 2);
    return window.open(url, 'share', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=yes, copyhistory=no, width='+ width +', height='+ height +', top='+ top +', left='+ left);
  }};

  RE.debounce = function(fn, delay) {
    var timer = null;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(context, args); }, delay);
    };
  };

  RE.loadSearchEngine = function(callback) {
    if (RE.searchEngine) { if (callback) callback(); return; }
    $('#searchResults').removeClass('d-none');
    $('#searchResultsList').html(blockLoader.spinner());
    fetch('/region/' + RE.REGION_SLUG + '/data/all.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        data.forEach(function(item) {
          item.price_uah       = RE.priceToUAH(item.price);
          var locClean = (item.location || item.region || '')
            .replace('м. ', '').replace(' район', '').toLowerCase().trim();
          item.location_clean  = RE.transliterate(locClean);
          item.location_city   = item.location
            ? RE.transliterate(item.location.replace('м. ', '').toLowerCase().trim())
            : '';
          item.location_region = item.region
            ? RE.transliterate(item.region.replace(' район', '').toLowerCase().trim())
            : '';
          item.floors_int      = parseInt(item.floors) || 0;
          item.floor_int       = parseInt(item.floor)  || 0;
          item.rooms_int       = parseInt(item.rooms)  || 0;
          item.surface_f       = parseFloat(item.surface)      || 0;
          item.surface_land_f  = parseFloat(item.surface_land) || 0;
          var firstPart = (item.address || '').split(',')[0].replace(/\s*\([^)]*\)/g, '').trim();
          item._streetOriginal = RE.isNonStreet(firstPart) ? '' : firstPart;
          item.street = RE.transliterate(item._streetOriginal);
          item.address_clean = RE.transliterate(item.address || '');
          var t = (item.type || '').toLowerCase();
          for (var gi = 0; gi < RE.TYPE_GROUPS.length; gi++) {
            var gf = RE.TYPE_GROUPS[gi].filters;
            for (var fj = 0; fj < gf.length; fj++) {
              if (t.includes(gf[fj].toLowerCase())) {
                item.type_category = RE.TYPE_GROUPS[gi].tag;
                gi = RE.TYPE_GROUPS.length;
                break;
              }
            }
          }
          if (!item.type_category) item.type_category = '';
        });
        RE.allData = data;

        RE.searchLocations = [...new Set(
          data.map(function(i) {
            return i.location
              ? RE.normalizeCyrillic(i.location.replace('м. ', '').toLowerCase().trim())
              : null;
          }).filter(Boolean)
        )];
        RE.searchRegions = [...new Set(
          data.map(function(i) {
            return i.region
              ? RE.normalizeCyrillic(i.region.replace(' район', '').toLowerCase().trim())
              : null;
          }).filter(Boolean)
        )];
        RE.searchTypes = [...new Set(
          data.map(function(i) { return RE.transliterate((i.type || '').toLowerCase().trim()); }).filter(Boolean)
        )];
        var streetsMap = {};
        data.forEach(function(i) {
          if (!i._streetOriginal) return;
          var tr = RE.transliterate(i._streetOriginal);
          if (!streetsMap[tr]) streetsMap[tr] = i._streetOriginal;
        });
        RE.searchAddrOriginals = {};
        RE.searchStreets = Object.keys(streetsMap).sort().map(function(tr) {
          RE.searchAddrOriginals[tr] = streetsMap[tr];
          return { value: tr, text: streetsMap[tr] };
        });

        var villages = [];
        data.forEach(function(item) {
          var addr = item.address || '';
          var normalized = addr.replace(/\bc\./g, 'с.');
          var matches = normalized.match(/с\.м?\.?т?\.?\s+[^,]+/g);
          if (matches) {
            villages = villages.concat(matches.map(function(v) { return v.trim(); }));
          }
        });
        var searchVillages = [...new Set(villages)];
        RE.searchPlaceOriginals = {};
        RE.searchPlaceTypes = {};
        RE.searchLocations.forEach(function(l) {
          var lTr = RE.transliterate(l);
          RE.searchPlaceTypes[lTr] = 'city';
          RE.searchPlaceOriginals[lTr] = l;
        });
        RE.searchRegions.forEach(function(r)   {
          var rTr = RE.transliterate(r);
          RE.searchPlaceTypes[rTr] = 'region';
          RE.searchPlaceOriginals[rTr] = r;
        });
        searchVillages.forEach(function(v)  {
          var vTr = RE.transliterate(v.replace(/^с\.м\.т\.\s+/, 'smt-').replace(/^с\.мт\s+/, 'smt-').replace(/^смт\s+/, 'smt-').replace(/^с\.\s+/, 's-'));
          RE.searchPlaceTypes[vTr] = 'village';
          RE.searchPlaceOriginals[vTr] = v;
        });

        RE.searchPlaces = [].concat(
          RE.searchLocations.map(function(l) {
            return { value: RE.transliterate(l), text: 'м. ' + RE.capitalize(l), group: 'Міста' };
          }),
          RE.searchRegions.map(function(r) {
            return { value: RE.transliterate(r), text: RE.capitalize(r) + ' район', group: 'Райони' };
          }),
          searchVillages.map(function(v) {
            return { value: RE.transliterate(v.replace(/^с\.м\.т\.\s+/, 'smt-').replace(/^с\.мт\s+/, 'smt-').replace(/^смт\s+/, 'smt-').replace(/^с\.\s+/, 's-')), text: v, group: 'Села/Селища' };
          })
        ).sort(function(a, b) { return a.text.localeCompare(b.text, 'uk'); });

        var seenVal = {};
        RE.searchPlaces = RE.searchPlaces.filter(function(p) {
          if (seenVal[p.value]) return false;
          seenVal[p.value] = true;
          return true;
        });

        if (typeof itemsjs !== 'function') {
          console.warn('itemsjs не завантажено');
          if (callback) callback();
          return;
        }
        RE.searchEngine = itemsjs(data, {
          searchableFields: ['address', 'location', 'region'],
          sortings: {
            price_asc:  { field: 'price_uah', order: 'asc' },
            price_desc: { field: 'price_uah', order: 'desc' },
          },
          aggregations: {
            type:             { title: 'Тип',     size: 20 },
            location_clean:   { title: 'Місто',   size: 30 },
            rent:             { title: 'Угода',   size: 5  },
            type_category:    { title: 'Категорія', size: 10 },
            street:           { title: 'Вулиця',  size: 50 },
            location_city:    { title: 'Місто',   size: 30 },
            location_region:  { title: 'Район',   size: 20 },
            rooms_int:        { title: 'Кімнати', size: 20 },
            surface_f:        { title: 'Площа',   size: 20 },
            surface_land_f:   { title: 'Ділянка', size: 20 },
            floor_int:        { title: 'Поверх',  size: 20 },
            floors_int:       { title: 'Поверхів', size: 20 },
            price_uah:        { title: 'Ціна',    size: 20 }
          }
        });
        if (callback) callback();
      })
      .catch(function(e) {
        console.error('JSON load error', e);
        $('#searchResults').removeClass('d-none');
        $('#searchResultsList').html(blockLoader.error('Ой! Щось пішло не так, не вдалося завантажити дані для пошуку'));
      });
  };

  RE.getFilteredIds = function(f) {
    var ids = [];
    for (var i = 0; i < RE.allData.length; i++) {
      var item = RE.allData[i];
      if (f.rooms) {
        if (f.rooms.min && item.rooms_int < f.rooms.min) continue;
        if (f.rooms.max && item.rooms_int > f.rooms.max) continue;
      }
      if (f.surface) {
        if (f.surface.min && item.surface_f < f.surface.min) continue;
        if (f.surface.max && item.surface_f > f.surface.max) continue;
      }
      if (f.land) {
        if (f.land.min && item.surface_land_f < f.land.min) continue;
        if (f.land.max && item.surface_land_f > f.land.max) continue;
      }
      if (f.floor) {
        if (f.floor.min && item.floor_int < f.floor.min) continue;
        if (f.floor.max && item.floor_int > f.floor.max) continue;
      }
      if (f.floors) {
        if (f.floors.min && item.floors_int < f.floors.min) continue;
        if (f.floors.max && item.floors_int > f.floors.max) continue;
      }
      if (f.price) {
        if (f.price.min && item.price_uah < f.price.min) continue;
        if (f.price.max && item.price_uah > f.price.max) continue;
      }
      if (f.loc) {
        var placeType = RE.searchPlaceTypes[f.loc];
        if (!placeType && (f.loc.indexOf('s-') === 0 || f.loc.indexOf('smt-') === 0)) {
          placeType = 'village';
        }
        placeType = placeType || 'city';
        if (placeType === 'village') {
          var addrNorm = (item.address_clean || '').replace(/\./g, '');
          var locNorm = f.loc.toLowerCase().replace(/\./g, '');
          if (!addrNorm.includes(locNorm)) continue;
        }
      }
      ids.push(i + 1);
    }
    return ids;
  };
})(RE);
