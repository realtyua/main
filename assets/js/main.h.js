---
layout: null
sitemap: false
---
{%- include js/jquery.min.js -%}
{%- include js/popper.min.js -%}
{%- include js/bootstrap.min.js -%}
{%- include js/bootstrap.smoothscroll.min.js -%}
{%- include js/tom-select.base.min.js -%}
{%- include js/itemsjs.min.js -%}
{%- capture ads_home_js -%}{%- include js/ads.home.js -%}{%- endcapture -%}
{{- ads_home_js | js_minify -}}
{%- capture realtyua_js -%}{%- include js/realtyua.js -%}{%- endcapture -%}
{{- realtyua_js | js_minify -}}
{%- capture load_more_js -%}
$(document).ready(function() {
  $('#loadMoreBtn').on('click', function() {
    var $hidden = $('.block.d-none').first();
    if ($hidden.length) {
      $hidden.removeClass('d-none').hide().fadeIn(300, function() {
        void $hidden[0].offsetHeight;
        setTimeout(function() {
          $('html, body').stop().animate({ scrollTop: $hidden.offset().top }, 400);
        }, 16);
        if ($('.block.d-none').length === 0) {
          $('#loadMoreBtn').hide();
        }
      });
    }
  });
  $('#collapseArea a[href^="#"]').on('click', function(e) {
    e.preventDefault();
    var targetId = $(this).attr('href').slice(1);
    var $target = $('#' + targetId);
    if ($target.length) {
      var $block = $target.closest('.block');
      var doScroll = function() {
        $('html, body').stop().animate({ scrollTop: $target.offset().top }, 400);
      };
      if ($block.length && $block.hasClass('d-none')) {
        $block.removeClass('d-none').hide().fadeIn(300, function() {
          void $target[0].offsetHeight;
          setTimeout(doScroll, 16);
          if ($('.block.d-none').length === 0) $('#loadMoreBtn').hide();
        });
      } else {
        doScroll();
      }
    }
  });
});
{%- endcapture -%}
{{- load_more_js | js_minify -}}