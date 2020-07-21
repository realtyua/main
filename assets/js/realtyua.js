
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

function handleTabLinks() {
  var hash = window.location.href.split("#")[1];
  if (hash !== undefined) {
    var hpieces = hash.split("/");
    for (var i=0;i<hpieces.length;i++) {
      var domelid = hpieces[i];
      var domitem = $('a[href=#' + domelid + '][data-toggle=tab]');
      if (domitem.length > 0) {
        if (i+1 == hpieces.length) {
          // last piece
          setTimeout(function() {
            // Highly unclear why this code needs to be inside a timeout call.
            // Possibly due to the fact that the first ?.tag('show') call needs
            // to have it's animation finishing before the next call is being
            // made.
            domitem.tab('show');
          },
          // This magic timeout is based on trial and error. I bumped it
          // partially to catch the visitor's attention.
          1000);
        } else {
          domitem.tab('show');
        }
      }
    }
  }
}

jQuery.ready(function() {
  handleTabLinks();
}
