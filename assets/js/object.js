---
layout: null
---
var $table = $('#realestate')
$(function() {
  var data = {{ data }}
  $table.bootstrapTable({data: data})
})
