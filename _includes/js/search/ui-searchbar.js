(function(RE) {
  'use strict';

  RE.searchRangeLabel = function(v, unit, prefix) {
    if (typeof v === 'string') return v;
    var p = prefix || '';
    var u = unit ? ' ' + unit : '';
    if (v.min && v.max) return p + v.min + '\u2013' + p + v.max + u;
    if (v.min)          return '\u0432\u0456\u0434 ' + p + v.min + u;
    if (v.max)          return '\u0434\u043e '  + p + v.max + u;
    return unit || '';
  };

  RE.searchTagLabel = function(k, v) {
    if (k === 'type')    return RE.searchTypeOriginals[v] || v;
    if (k === 'rent')    return v === '1' ? 'Оренда' : 'Продаж';
    if (k === 'loc') {
      var orig = RE.searchPlaceOriginals[v] || v;
      var pt = RE.searchPlaceTypes[v] || 'city';
      if (pt === 'city')   return 'м. ' + RE.capitalize(orig);
      if (pt === 'region') return RE.capitalize(orig) + ' район';
      return orig;
    }
    if (k === 'addr')    return RE.searchAddrOriginals[v] || v;
    if (k === 'rooms')   return RE.searchRangeLabel(v, 'кімн.', '');
    if (k === 'surface') return RE.searchRangeLabel(v, 'м²', '');
    if (k === 'land')    return RE.searchRangeLabel(v, 'м² ділянка', '');
    if (k === 'floor')   return RE.searchRangeLabel(v, 'поверх', '');
    if (k === 'floors')  return RE.searchRangeLabel(v, 'поверхів', '');
    if (k === 'price')   return RE.searchRangeLabel(v, '₴', '');
    return String(v);
  };

  RE.renderSearchTags = function() {
    var html = Object.keys(RE.searchState.f).map(function(k) {
      return '<span class="badge badge-primary mr-1 mb-1" style="cursor:pointer;" onclick="RE.removeSearchTag(event,\'' + k + '\')">' +
        RE.searchTagLabel(k, RE.searchState.f[k]) +
        ' ×' +
      '</span>';
    }).join('');
    document.getElementById('searchTags').innerHTML = html;
    RE.updateSearchPlaceholder();
  };

  RE.removeSearchTag = function(e, k) {
    e.stopPropagation();
    if (k === 'type') RE.searchState.type = null;
    delete RE.searchState.f[k];
    if (k === 'loc' && RE.searchState.tsLoc) {
      RE.searchState.tsLoc.destroy();
      RE.searchState.tsLoc = null;
    }
    if (k === 'addr' && RE.searchState.tsAddr) {
      RE.searchState.tsAddr.destroy();
      RE.searchState.tsAddr = null;
    }
    RE.searchState.activeChip = null;
    RE.searchPage = 1;
    RE.renderSearchTags();
    RE.renderSearchChips();
    RE.renderSearchPanel(null);
    RE.runSearch();
  };

  RE.applyType = function(slug) {
    var tag = slug ? (RE.searchTypeOriginals[slug] || slug) : '';
    if (tag === RE.searchState.f.type) {
      RE.searchState.type = null;
      delete RE.searchState.f.type;
    } else {
      RE.searchState.type = tag || null;
      if (tag) { RE.searchState.f.type = tag; } else { delete RE.searchState.f.type; }
    }
    RE.searchState.sort = null;
    RE.searchState.activeChip = null;
    RE.searchPage = 1;
    $('#searchListings').val('');
    RE.renderSearchTags();
    RE.renderSearchChips();
    RE.renderSearchPanel(null);
    RE.runSearch();
    $('#searchListings').focus();
  };

  RE.renderTypeChip = function() {
    var active = RE.searchState.f.type;
    var label = active || 'Тип';
    var allItems = '<button type="button" class="dropdown-item' + (!active ? ' active' : '') + '" onclick="event.preventDefault(); event.stopPropagation(); RE.applyType(\'\')">Всі</button>';
    allItems += '<div class="dropdown-divider my-0"></div>';
    for (var i = 0; i < RE.TYPE_GROUPS.length; i++) {
      var g = RE.TYPE_GROUPS[i];
      allItems += '<button type="button" class="dropdown-item' + (g.tag === active ? ' active' : '') + '" onclick="event.preventDefault(); event.stopPropagation(); RE.applyType(\'' + g.slug + '\')">' + g.tag + '</button>';
    }
    return '<div class="dropdown d-inline-block mr-1 mb-1">' +
      '<button class="btn btn-sm ' + (active ? 'btn-primary' : 'btn-outline-primary') + ' dropdown-toggle" type="button" data-toggle="dropdown">' +
        (active ? '✓ ' : '') + label +
      '</button>' +
      '<div class="dropdown-menu">' + allItems + '</div>' +
    '</div>';
  };

  RE.renderSearchChips = function() {
    var $chips = $('#searchChips');
    var group = RE.getTypeGroup(RE.searchState.type);
    var keys  = group ? group.chips : RE.DEFAULT_CHIPS;
    var html  = RE.renderTypeChip();
    html += keys.map(function(k) {
      if (k === 'rent') return RE.renderRentChip();
      var active = RE.searchState.f[k] !== undefined;
      return '<span class="btn btn-sm mr-1 mb-1 ' + (active ? 'btn-primary' : 'btn-outline-primary') + '" ' +
        'onclick="RE.toggleSearchChip(\'' + k + '\')">' +
        (active ? '✓ ' : '+ ') + RE.CHIP_LABELS[k] +
        (active ? ' ×' : '') +
      '</span>';
    }).join('');
    $chips.html(html).removeClass('d-none');
  };

  RE.renderRentChip = function() {
    var rent       = RE.searchState.f.rent;
    var saleActive = rent === '';
    var rentActive = rent === '1';
    return '<span class="btn btn-sm mr-1 mb-1 ' + (saleActive ? 'btn-primary' : 'btn-outline-primary') + '" ' +
      'onclick="RE.applyRent(event,\'\')">' +
      (saleActive ? '✓ ' : '') + 'Продаж' +
      (saleActive ? '  × ' : '') +
    '</span>' +
    '<span class="btn btn-sm mr-1 mb-1 ' + (rentActive ? 'btn-primary' : 'btn-outline-primary') + '" ' +
      'onclick="RE.applyRent(event,\'1\')">' +
      (rentActive ? '✓ ' : '') + 'Оренда' +
      (rentActive ? '  × ' : '') +
    '</span>';
  };

  RE.applyRent = function(e, val) {
    e.stopPropagation();
    if (RE.searchState.f.rent === val) {
      delete RE.searchState.f.rent;
    } else {
      RE.searchState.f.rent = val;
    }
    RE.searchPage = 1;
    RE.renderSearchTags();
    RE.renderSearchChips();
    RE.runSearch();
  };

  RE.removeSearchChip = function(e, k) {
    e.stopPropagation();
    RE.removeSearchTag(e, k);
  };

  RE.toggleSearchChip = function(k) {
    RE.searchState.activeChip = (RE.searchState.activeChip === k) ? null : k;
    RE.renderSearchPanel(RE.searchState.activeChip);
  };

  RE.renderSearchPanel = function(k) {
    var $panel = $('#searchFilterPanel');
    if (!k) {
      $panel.addClass('d-none').html('');
      if (RE.searchState.tsLoc)  { RE.searchState.tsLoc.destroy();  RE.searchState.tsLoc  = null; }
      if (RE.searchState.tsAddr) { RE.searchState.tsAddr.destroy(); RE.searchState.tsAddr = null; }
      return;
    }
    $panel.removeClass('d-none');
    if (k === 'loc') {
      $panel.html('<div id="tsLocSelect"></div>');
      setTimeout(function() {
        if (RE.searchState.tsLoc) { RE.searchState.tsLoc.destroy(); RE.searchState.tsLoc = null; }
        RE.searchState.tsLoc = new RE.SearchableSelect('#tsLocSelect', {
          options:    RE.searchPlaces,
          placeholder: 'Введіть назву...',
          maxOptions: 30,
          onChange: function(val) {
            if (val) { RE.searchPage = 1; RE.applySearchSimple('loc', val); }
          }
        });
        if (RE.searchState.f.loc) RE.searchState.tsLoc.setValue(RE.searchState.f.loc, true);
      }, 50);
    } else if (k === 'addr') {
      $panel.html('<div id="tsAddrSelect"></div>');
      setTimeout(function() {
        if (RE.searchState.tsAddr) { RE.searchState.tsAddr.destroy(); RE.searchState.tsAddr = null; }
        RE.searchState.tsAddr = new RE.SearchableSelect('#tsAddrSelect', {
          options:    RE.searchStreets,
          placeholder: 'Введіть вулицю...',
          maxOptions: 30,
          onChange: function(val) {
            if (val) { RE.searchPage = 1; RE.applySearchSimple('addr', val); }
          }
        });
        if (RE.searchState.f.addr) RE.searchState.tsAddr.setValue(RE.searchState.f.addr, true);
      }, 50);
    } else if (k === 'rooms') {
      $panel.html(RE.searchRangePanel('rooms',   RE.searchState.f.rooms   || {}, '',    1,  20));
    } else if (k === 'surface') {
      $panel.html(RE.searchRangePanel('surface', RE.searchState.f.surface || {}, 'м²',  10, 2000));
    } else if (k === 'land') {
      $panel.html(RE.searchRangePanel('land',    RE.searchState.f.land    || {}, 'м²',  0,  100000));
    } else if (k === 'floor') {
      $panel.html(RE.searchRangePanel('floor',   RE.searchState.f.floor   || {}, '',    0,  50));
    } else if (k === 'floors') {
      $panel.html(RE.searchRangePanel('floors',  RE.searchState.f.floors  || {}, '',    1,  50));
    } else if (k === 'price') {
      $panel.html(RE.searchRangePanel('price',   RE.searchState.f.price   || {}, '₴',   0,  100000000));
    }
  };

  RE.searchRangePanel = function(key, v, unit, mn, mx) {
    return '<div class="form-row">' +
      '<div class="col">' +
        '<input type="number" class="form-control form-control-sm" placeholder="від" ' +
          'name="' + key + '_min" ' +
          'oninput="RE.applySearchRange(\'' + key + '\', \'min\', this.value)" value="' + (v.min || '') + '">' +
      '</div>' +
      '<div class="col">' +
        '<input type="number" class="form-control form-control-sm" placeholder="до" ' +
          'name="' + key + '_max" ' +
          'oninput="RE.applySearchRange(\'' + key + '\', \'max\', this.value)" value="' + (v.max || '') + '">' +
      '</div>' +
      (unit ? '<div class="col-auto"><span class="form-control-plaintext">' + unit + '</span></div>' : '') +
    '</div>';
  };
})(window.RE);
