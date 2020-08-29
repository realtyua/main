---
layout: blank
---

title: {{ page.title }}
data: {{ data }}

var $table = $('#realestate');

$(function() {
  var data = {{ data | jsonify }};
  $table.bootstrapTable({data: data})
})
