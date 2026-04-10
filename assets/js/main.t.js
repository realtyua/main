---
layout: null
sitemap: false
---
{%- include js/jquery.min.js -%}
{%- include js/popper.min.js -%}
{%- include js/bootstrap.min.js -%}
{%- include js/photoswipe.min.js -%}
{%- include js/photoswipe-ui-default.min.js -%}
{%- include js/bootstrap.lightbox.min.js -%}
{%- include js/bootstrap.smoothscroll.min.js -%}
{%- include js/bootstrap-table.min.js -%}
{%- include js/bootstrap-table-uk-UA.min.js -%}
{%- include js/bootstrap-table-mobile.min.js -%}
{%- include js/tom-select.base.min.js -%}
{%- include js/itemsjs.min.js -%}
{%- capture table_js -%}{%- include js/table.js -%}{%- endcapture -%}
{{- table_js | js_minify -}}
{%- capture realtyua_js -%}{%- include js/realtyua.js -%}{%- endcapture -%}
{{- realtyua_js | js_minify -}}