
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})


$('.nav-tabs>li>a.nav-link').on('click', function(){
    $('.navbar-collapse').collapse('hide');
})

document.getElementsByClassName('card').onclick = function(e) {
  if(e.target != document.getElementsByClassName('card')) {
      console.log('You clicked outside');
  } else {
      console.log('You clicked inside');
  }
}


// $(document).on('click',function(){
//     $('.tab-pane').find('.card>.show').collapse('hide');
//     //$('.collapse').collapse('hide');
// })


// $(".nav-tabs>li>a.nav-link:not('.dropdown-toggle')").on('click', function (){
//   $('.navbar-collapse').collapse('hide');
// })
//
// $(".card>div>a.navbar-toggler:not('.dropdown-toggle')").on('click', function (){
//   $('.multi-collapse').collapse('hide');
// })

//
// $(".navbar-nav li a:not('.dropdown-toggle')").on('click', function (){
//   $('.navbar-collapse').collapse('hide');
// })



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
