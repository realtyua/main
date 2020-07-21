
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})

$('.nav-tabs>li>a.nav-link').on('click', function(){
    $('.navbar-collapse').collapse('hide');
})


// // Javascript to enable link to tab
// var url = document.location.toString();
// if (url.match('#')) {
//     $('.nav-tabs a[href="#'+url.split('#')[1]+'"]').tab('show') ;
// }
//
// // With HTML5 history API, we can easily prevent scrolling!
// $('.nav-tabs a').on('shown.bs.tab', function (e) {
//     if(history.pushState) {
//         history.pushState(null, null, e.target.hash);
//     } else {
//         window.location.hash = e.target.hash; //Polyfill for old browsers
//     }
// })
