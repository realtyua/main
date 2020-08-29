---
layout: null
---
var $table = $('#realestate')
$(function() {
  var data = {{ isJson | jsonify }}
  $table.bootstrapTable({data: data})
})
