var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'));
console.log(tooltipTriggerList);
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) { return new bootstrap.Tooltip(tooltipTriggerEl) });
console.log(tooltipList);
$('.nav-tabs>li>a.nav-link').on('click', function(){ $('.navbar-collapse').collapse('hide'); })
$(document).on('click', function (e) { if ($(e.target).closest(".card").length === 0) { $('.collapse').collapse('hide'); } });
$(document).ready(function(){ $('.toast').toast('show'); $('.alert').alert(); });
