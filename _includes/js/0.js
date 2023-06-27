
var $reObj = $('#property');
const params = new Proxy(new URLSearchParams(window.location.search), { get: (searchParams, prop) => searchParams.get(prop), });
let value = params.id;
if (value && value !== '') {
  if (value.split('').length === 12) {
    $reObj.bootstrapTable('filterBy', { phone: value });
  } else {
    $reObj.bootstrapTable('filterBy', { id: value });
    $reObj.on('post-body.bs.table', (e) => {
      const $trs = $(e.currentTarget).find('tbody tr')
      if ($trs.length === 1) {
        $reObj.bootstrapTable('toggleView');
        $.each($trs, function (key, tr) {
          $reObj.bootstrapTable('expandRow', $(tr).data('index'));
          $(tr).addClass('active');
        })
      }
    })
  }
}
