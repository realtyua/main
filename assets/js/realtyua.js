
// var isSvg = false
// var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'))
// var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
//   return new bootstrap.Tooltip(tooltipTriggerEl)
// })



// $('a[data-toggle="tooltip"]').tooltip({
//   animated: 'fade'
// });


// $(document).ready(function() {
//   $('[data-toggle="tooltip"]').tooltip();
// });
//
// function change_button(button_id, bool_val) {
//   var button_obj = document.getElementById(button_id);
//   button_obj.disabled = bool_val;
//
//   // Disable tooltip
//   if (bool_val) {
//     $('#' + button_id).tooltip('hide').tooltip('disable');
//   } else {
//     $('#' + button_id).tooltip('enable');
//   }
// }

// $(function() {
//   var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'))
//   var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
//     return new bootstrap.Tooltip(tooltipTriggerEl)
//   })
// })

// $(document).ready(function(){
//   $('[data-toggle="tooltip"]').tooltip();
// });

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});

$(function () {
    $('circle').tooltip({
      'container': 'body'
    })
});

//
// $(function (tooltip) {
//   new bootstrap.Tooltip(
//     tooltip,{selector:'[data-toggle="tooltip"]'}
//   )
// })
