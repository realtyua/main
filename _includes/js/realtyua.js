
$(document).ready(function(){
$("body").tooltip({selector:'[data-toggle="tooltip"]'});
$('.nav-tabs>li>a.nav-link').on('click', function(){ $('.navbar-collapse').collapse('hide'); });
$(document).on('click', function (e) { if ($(e.target).closest(".card").length === 0) { $('.collapse').collapse('hide'); } });
$(document).ready(function(){ $('.toast').toast('show'); $('.alert').alert(); });
//$(".btn-group").on("click", function(event){ var liparent=$(this.parentElement); var divChild=liparent.find('div'); var xOffset=liparent.offset().left; var alignRight=($(document).width()-xOffset)>xOffset; if (liparent.hasClass("dropdown-menu")) {} else { divChild.toggleClass("dropdown-menu-right", alignRight); } });
});
