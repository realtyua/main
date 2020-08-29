---
layout: null
---

data: {{ data }}

var $table = $('#realestate');

$(function() {
  var data = {{ data | jsonify }};
  $table.bootstrapTable({data: data})
})
