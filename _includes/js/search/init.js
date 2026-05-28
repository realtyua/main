(function(RE) {
  'use strict';

  $(document).ready(function() {
    $("body").tooltip({ selector: '[data-toggle="tooltip"]' });
    $('[data-toggle="popover"]').popover();

    /* -- Phone reveal -- */
    $(document).on('click', '.tel-btn', function(e) {
      e.stopPropagation();
      var $btn = $(this);
      var $canvas = $btn.find('canvas');
      if ($btn.data('revealed')) return;
      var id = $btn.data('id');

      var $table = $('table#property');
      if ($table.length) {
        var tableData = $table.bootstrapTable('getData');
        for (var i = 0; i < (tableData || []).length; i++) {
          if (String(tableData[i].id) === String(id) && tableData[i].phone) {
            RE.revealPhone($btn, $canvas, tableData[i].phone);
            return;
          }
        }
      }

      RE.drawLoading($canvas[0]);
      RE.loadPhoneCache(function(phones) {
        var encrypted = phones[id];
        if (encrypted) {
          RE.revealPhone($btn, $canvas, encrypted);
        } else {
          RE.drawPhoneError($canvas[0]);
        }
      });
    });

    $(document).ready(function() {
      $('.tel-canvas').each(function() { RE.drawPlaceholder(this); });
    });

    /* -- Nav / collapse behavior -- */
    $('.nav-tabs>li>a.nav-link').on('click', function() {
      $('.navbar-collapse').collapse('hide');
    });
    $(document).on('click', function(e) {
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

    /* -- Search content management -- */
    var $mainContainer = $('main.content');
    var $originalContent = null;
    var $searchContent = null;

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

    /* -- Location select (rehiony) -- */
    function initSearchableSelect() {
      if (RE.searchableRehiony) {
        RE.searchableRehiony.destroy();
        RE.searchableRehiony = null;
      }
      var $el = document.getElementById('rehiony');
      if (!$el) return;
      RE.searchableRehiony = new RE.SearchableSelect('#rehiony', {
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
        onChange: function(value) {
          if (value !== '') {
            window.location = value;
          }
        }
      });
    }

    initSearchableSelect();

    /* -- Search mode switch (loc / obj) -- */
    $('input[name="searchMode"]').on('change', function() {
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
        setTimeout(function() {
          $('#searchListings').focus();
        }, 50);
        RE.loadSearchEngine(function() {
          RE.searchState.f = {};
          RE.searchState.type = null;
          RE.searchState.sort = null;
          RE.searchPage = 1;
          RE.renderSearchTags();
          RE.renderSearchChips();
          RE.runSearch();
        });
      }
    });

    /* -- Search input handler (debounced 300ms) -- */
    var searchInputHandler = RE.debounce(function() {
      var query = $(this).val().trim().toLowerCase();
      if (query.length < 1) return;
      RE.loadSearchEngine(function() {
        var matched = null;
        for (var i = 0; i < RE.TYPE_GROUPS.length; i++) {
          var group = RE.TYPE_GROUPS[i];
          for (var j = 0; j < group.triggers.length; j++) {
            if (query.includes(group.triggers[j])) {
              matched = group;
              break;
            }
          }
          if (matched) break;
        }
        if (matched && RE.searchState.f['type'] !== matched.tag) {
          RE.searchState.type    = matched.tag;
          RE.searchState.f['type'] = matched.tag;
          $('#searchListings').val('');
          RE.renderSearchTags();
          RE.renderSearchChips();
        }
        if (Object.keys(RE.searchState.f).length > 0) {
          RE.searchPage = 1;
          RE.runSearch();
        }
      });
    }, 300);
    $('#searchListings').on('input', searchInputHandler);
  });
})(window.RE);
