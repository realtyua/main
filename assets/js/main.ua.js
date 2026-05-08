---
layout: null
sitemap: false
---

{%- include js/jquery.min.js -%}
{%- include js/popper.min.js -%}
{%- include js/bootstrap.min.js -%}
{%- include js/bootstrap.smoothscroll.min.js -%}
{%- include js/itemsjs.min.js -%}
{%- capture ua_home_js -%}{%- include js/ua.home.js -%}{%- endcapture -%}
{{- ua_home_js | js_minify -}}
{%- capture realtyua_js -%}{%- include js/realtyua.js -%}{%- endcapture -%}
{{- realtyua_js | js_minify -}}