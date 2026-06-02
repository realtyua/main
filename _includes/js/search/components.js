(function(RE) {
  'use strict';

  RE.SearchableSelect = function(el, opts) {
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
      var words = query ? query.split(/\s+/) : [];
      for (var i = 0; i < settings.options.length; i++) {
        if (result.length >= maxOptions) break;
        var item = settings.options[i];
        if (!query) {
          result.push(item);
        } else {
          var text = item.text.toLowerCase();
          var allMatch = words.every(function(word) {
            return text.indexOf(word) !== -1;
          });
          if (allMatch) {
            result.push(item);
          }
        }
      }
      return result;
    }

    function render(q) {
      var items = filtered(q);
      if (items.length === 0) {
        dropdown.innerHTML = '<span class="dropdown-item-text text-muted px-3">\u0417\u0430 \u0446\u0438\u043c \u0437\u0430\u043f\u0438\u0442\u043e\u043c "' + RE.escapeHtml(q.trim()) + '" \u043d\u0456\u0447\u043e\u0433\u043e \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e</span>';
      } else {
        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var active = item.value === currValue ? ' active' : '';
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
      for (var i = 0; i < settings.options.length; i++) {
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

      if (code === 40) {
        e.preventDefault();
        focusIdx = Math.min(focusIdx + 1, items.length - 1);
        for (var i = 0; i < items.length; i++) {
          if (i === focusIdx) { items[i].classList.add('active'); }
          else { items[i].classList.remove('active'); }
        }
      } else if (code === 38) {
        e.preventDefault();
        focusIdx = Math.max(focusIdx - 1, -1);
        for (var i = 0; i < items.length; i++) {
          if (i === focusIdx) { items[i].classList.add('active'); }
          else { items[i].classList.remove('active'); }
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
  };
})(window.RE);
