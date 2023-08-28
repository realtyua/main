
$(document).ready(function(){
$("body").tooltip({selector:'[data-toggle="tooltip"]'});
$('.nav-tabs>li>a.nav-link').on('click', function(){ $('.navbar-collapse').collapse('hide'); });
$(document).on('click', function (e) { if ($(e.target).closest(".card").length === 0) { $('.collapse').collapse('hide'); } });
$(document).ready(function(){ $('.toast').toast('show'); $('.alert').alert(); });
var settings = { create: false, maxOptions: 10, maxItems: 1, sortField: 'text', render: {	no_results:function( data,escape ) {	return '<div class="no-results">За цим запитом "'+escape(data.input)+'" нічого не знайдено</div>'; } }, onChange: function(value) { if (value !== '') { window.location = value; } } }; new TomSelect('#areaSelect',settings);
});
