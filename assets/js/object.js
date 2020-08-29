---
layout: null
---
var $table = $('#realestate')
$(function() {
  var data = {{ isJson }}
  $table.bootstrapTable({data: data})
})
