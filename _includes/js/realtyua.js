{%- capture loader_js -%}{%- include js/block-loader.js -%}{%- endcapture -%}
{{- loader_js | js_minify -}}
{%- capture polyfill_js -%}{%- include js/search/polyfill.js -%}{%- endcapture -%}
{{- polyfill_js | js_minify -}}
{%- capture core_js -%}{%- include js/search/core.js -%}{%- endcapture -%}
{{- core_js | js_minify -}}
{%- capture filters_js -%}{%- include js/search/filters.js -%}{%- endcapture -%}
{{- filters_js | js_minify -}}
{%- capture components_js -%}{%- include js/search/components.js -%}{%- endcapture -%}
{{- components_js | js_minify -}}
{%- capture ui_searchbar_js -%}{%- include js/search/ui-searchbar.js -%}{%- endcapture -%}
{{- ui_searchbar_js | js_minify -}}
{%- capture ui_results_js -%}{%- include js/search/ui-results.js -%}{%- endcapture -%}
{{- ui_results_js | js_minify -}}
{%- capture init_js -%}{%- include js/search/init.js -%}{%- endcapture -%}
{{- init_js | js_minify -}}
var sShare = RE.sShare;