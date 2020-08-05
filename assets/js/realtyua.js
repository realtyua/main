$(function () {
  if ($('a.lightbox').length > 0) {
    var photoswipeTemplate = '\
        <div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">\
            <div class="pswp__bg"></div>\
            <div class="pswp__scroll-wrap">\
                <div class="pswp__container">\
                    <div class="pswp__item"></div>\
                    <div class="pswp__item"></div>\
                    <div class="pswp__item"></div>\
                </div>\
                <div class="pswp__ui pswp__ui--hidden">\
                    <div class="pswp__top-bar">\
                        <div class="pswp__counter"></div>\
                        <button class="pswp__button pswp__button--close" title="Close (Esc)"></button>\
                        <button class="pswp__button pswp__button--share" title="Share"></button>\
                        <button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>\
                        <button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button>\
                        <div class="pswp__preloader">\
                            <div class="pswp__preloader__icn">\
                                <div class="pswp__preloader__cut">\
                                    <div class="pswp__preloader__donut"></div>\
                                </div>\
                            </div>\
                        </div>\
                    </div>\
                    <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">\
                        <div class="pswp__share-tooltip"></div> \
                    </div>\
                    <button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)"></button>\
                    <button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)"></button>\
                    <div class="pswp__caption">\
                        <div class="pswp__caption__center"></div>\
                    </div>\
                </div>\
            </div>\
        </div>';
    $('body').append(photoswipeTemplate);
  }

  var photoswipeContainer = document.querySelectorAll('.pswp')[0];
  var container = [];

  // Loop over gallery items and push it to the array
  //$('div[id=' + gid + ']').each(function(){
  $('#gallery').find('figure').each(function(){
    var $link = $(this).find('a'),
        item = {
          src: $link.attr('href'),
          w: $link.data('width'),
          h: $link.data('height'),
          title: $link.data('caption')
        };
    container.push(item);
  });

  // Define click event on gallery item
  $('a').click(function(event){

    // Prevent location change
    event.preventDefault();

    // Define object and gallery options
    var $pswp = $('.pswp')[0],
        options = {
          index: $(this).parent('figure').index(),
          bgOpacity: 0.85,
          showHideOpacity: true
        };

    // Initialize PhotoSwipe
    var gallery = new PhotoSwipe($pswp, photoswipeContainer, PhotoSwipeUI_Default, container, options);
    gallery.init();
  });

})


var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})

$('.nav-tabs>li>a.nav-link').on('click', function(){
    $('.navbar-collapse').collapse('hide');
})

$(document).on('click', function (e) {
    if ($(e.target).closest(".card").length === 0) {
        $('.collapse').collapse('hide');
    }
});
