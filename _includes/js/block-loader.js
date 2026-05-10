var blockLoader = (function() {
  function spinner() {
    return '<div class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
        '<span class="sr-only">Завантаження...</span>' +
      '</div></div>';
  }

  function error(msg) {
    var url = window.location.href;
    return '<div class="alert alert-warning my-3" role="alert">' +
      (msg || 'Не вдалося завантажити дані') +
      '. <a href="' + url + '" class="alert-link">Спробуйте ще раз</a></div>';
  }

  function load(container, url, opts) {
    opts = opts || {};
    var $el = (typeof container === 'string') ? $('#' + container) : $(container);
    if (opts.loading !== false) $el.html(spinner());
    fetch(url)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(data) {
        if (opts.validate && !opts.validate(data)) throw new Error('Invalid data');
        (opts.render || $.noop)(data, $el);
      })
      .catch(function(err) {
        console.error('[blockLoader]', err);
        $el.html(opts.onError ? opts.onError(err) : error());
      });
  }

  return { load: load, error: error, spinner: spinner };
})();
