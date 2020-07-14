// $(function() {
//   var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'))
//   var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
//     return new bootstrap.Tooltip(tooltipTriggerEl)
//   })
// })

$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip();
});

// $(function () {
//     $('[data-toggle="tooltip"]').tooltip()
// });
//
// $(function (tooltip) {
//   new bootstrap.Tooltip(
//     tooltip,{selector:'[data-toggle="tooltip"]'}
//   )
// })
