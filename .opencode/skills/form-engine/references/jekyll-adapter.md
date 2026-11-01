# Jekyll-адаптер

Репо: `realtyua/main`. Плагін: `_plugins/form_engine.rb`.

## Потік

```text
jekyll build
└── hook :site, :post_read
    └── FormEngine.bake_all(site)
        ├── знайти сторінки з {% include form/app/<name>.html %}
        ├── для кожного _data/<name>.yml з формою:
        │   ├── перевірити id == ім'я файлу
        │   ├── знайти endpoint (submit.action → site.<id>_endpoint)
        │   ├── node validate-config.mjs <path> --strict
        │   └── node gen-form-app.mjs --stdin-json
        └── записати _includes/form/app/<name>.html
```

Форму запечують **лише якщо** її хтось include-ить. Це навмисно: notify
монтується своїм JS і не мусить ламати build, якщо його _data зміниться.

### Правила, які ламають build (fatal)

- конфіг не пройшов `validate-config.mjs --strict`;
- `config.id != <ім'я _data-файлу>`;
- endpoint порожній або не резолвиться;
- Node недоступний у PATH;
- генератор не зміг записати фрагмент.

### Сканування include-ів

Регекс: `{%-? include form/app/([\w-]+)\.html`.
Пропускаються: `_site`, `_data`, `_includes/form/app`, `_form-engine`, `test`,
`.github`, `assets`, `node_modules`, `.git`, `.jekyll-cache`, `vendor`.

Тобто рядок у **HTML/MD** сторінки — це opt-in. Згадка в коментарі чи прозі
не рахується, бо шукається саме тег.

## Include-контракт

```liquid
{% include form/app/add-property.html %}
```

Фрагмент самодостатній: JSON-острівець, captcha, inline CSS/JS карти й теми,
chrome, форма, addon-модалки, `<script type="module">` з `app.js`.

**Не редагувати** `_includes/form/app/*.html`. Це generated. Правка зникне на
наступному build.

## Site-opts

`_form-engine/tools/site-opts.mjs` — єдине місце, де Jekyll-сайт знає про світ:

| Функція | Призначення |
| --- | --- |
| `loadSiteOpts(root, config)` | `opts` для `renderPage()`: копірайт, курси, endpoint, inline Leaflet/style |
| `engineFiles(root)` | усі файли рушія, від яких залежить bake |
| `engineDigest(root)` | хеш для `?v=` токена |
| `freshnessSha(root, dataPath)` | хеш конфіг + site + рушій (маркер свіжості) |

Читає `_config.yml` і `_data/uk.yml` напряму, тому ручний
`node _form-engine/tools/gen-form-app.mjs` дає байт-у-байт той самий результат,
що автоматичний build.

Inline-асети Jekyll: `_includes/css/leaflet.css`, `_includes/js/leaflet.js`.

## Як сторінка отримує рушій

`_includes/java-script.html` підключає `assets/js/form-engine/app.js` один раз
(єдиний browser entry). `app.js` знаходить усі
`script[type="application/json"][id$="-config"]`, читає `behavior.mode`
(`page` / `modal`) і викликає `bootPage` або `bootModal`.

## Notify — окремий випадок

Notify **не** проходить через `{% include form/app/notify.html %}`. Робоча
модалка — `_includes/modals/notify-property.html`, підключена в
`_layouts/property.html`. Вона кладе два JSON-острівці:

- `#notify-config` — `site.data.notify`;
- `#notify-page` — `uid`, `property_url`, `property_email`, `property_title`.

`property_url` використовує `page.url | absolute_url`, тому потребує
`site.url` у `_config.yml` (зараз закоментований — відомий дефект JEK-R2).

Відомий борг (JEK-R5): трекнутий дубль `_includes/form/notify-property.html`,
сирітський `_includes/form/app/notify.html`, застарілий коментар у робочій
модалці (згадує `form-notify.js`).

## Відомі дефекти готовності (не «фіксити» мовчки)

| ID | Дефект |
| --- | --- |
| JEK-R1 | Подвійний Leaflet: фрагмент уже інлайнить CSS/JS, а `head.html` і `java-script.html` додають ще раз; порожній `{% if page.layout == 'property' %}` |
| JEK-R2 | `_config.yml:3` `url:` закоментований → відносний `property_url` |
| JEK-R3 | `check-add-property`: 13 copy-drift проти замороженого baseline |
| JEK-R4 | `check-add-property`: структурний `file-info` |
| JEK-R5 | Мертвий код: legacy `_includes/form/**`, дубль notify, сирота, `.old` |
| JEK-R6 | `_form-engine/README.md` описує застарілий статус |

## Generated vs source

| Generated | Source |
| --- | --- |
| `_includes/form/app/<name>.html` | `_data/<name>.yml` + `assets/js/form-engine/**` |
| `assets/data/form-*.json` | конфіг відповідної форми (для воркера) |
| `_site/**` | усе вище |

`_form-engine/baseline/**` — заморожені знімки для гейтів. Не перегенеровувати
наосліп: baseline — це доказ, а не поточний стан.
