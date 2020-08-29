---
layout: null
---

{{ page.title }}


{{ data }}

var $table = $('#realestate');

$(function() {
  var data = {{ data | jsonify }};
  $table.bootstrapTable({data: data})
})
