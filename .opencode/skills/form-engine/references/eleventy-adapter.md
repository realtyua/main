# Eleventy-адаптер

Репо: `reifua/main` (reference `reifua`). Адаптер: `lib/form-engine.js`.

## Потік

```text
eleventy build
└── eleventyConfig.on('beforeBuild')
    ├── прочитати src/_data/*.ya?ml
    ├── відібрати form-shaped (version + id + steps)
    ├── перевірити id == ім'я файлу
    ├── renderPage(config, opts)  → тримати в пам'яті (Map)
    └── {% formApp "name" %} → віддати готовий рядок
```

Nunjucks не перепарсить фрагмент, бо shortcode повертає рядок напряму. Саме тому
тут не можна використовувати Liquid-include, як на Jekyll: Nunjucks зламався б на
JSON/CSS/JS усередині.

## Відмінності від Jekyll

| | Jekyll | 11ty |
| --- | --- | --- |
| Тригер | `{% include form/app/<name>.html %}` | `{% formApp "name" %}` |
| Куди пише | файл `_includes/form/app/<name>.html` | у пам'ять, без файлу |
| Дані сайту | `_config.yml` + `_data/uk.yml` через `site-opts.mjs` | власні `opts` у `lib/form-engine.js` |
| Тема за замовчуванням | `bootstrap4` | `tailwind` (`config.theme \|\| 'tailwind'`) |
| Leaflet | `_includes/{css,js}/leaflet.*` | `src/assets/vendor/leaflet.{css,js}` |
| Селекція форм | лише явно include-нуті | **усі** form-shaped `src/_data/*.yml` |

11ty-адаптер не читає `_config.yml` і не викликає `site-opts.mjs`. Конфіг
лишається site-agnostic; усе site-специфічне — в адаптері.

## Passthrough (`.eleventy.js`)

Обов'язково, інакше сторінка отримає 404 на модулі:

```js
config.addPassthroughCopy('src/assets/js/form-engine');
config.addPassthroughCopy('src/assets/data/');
config.addPassthroughCopy('src/assets/css/images/**/*');   // спрайти Leaflet
config.addWatchTarget('src/assets/js/');
require('./lib/form-engine')(config);
```

Leaflet JS/CSS інлайняться у фрагмент, але PNG-спрайти лишаються статикою:
CSS посилається на `url(images/...)`, а `doInitMap` ставить
`L.Icon.Default.imagePath = '/assets/css/images/'`.

## Tailwind purge

Тема Tailwind має бути в `content` для purge, інакше утиліти з `themes/tailwind.js`
зникнуть з бандла. `themes/tailwind.js` експортує `SAFELIST`, синхронний з
`FRACTIONS` і розмірами модалок. Зміна сітки/модалок = оновлення SAFELIST.

## Поточний стан (на момент плану)

- Єдина форма: `src/new.njk` → `{% formApp "demo" %}` (tailwind).
- `src/_data/add-property.yml` і `notify.yml` існують, але сторінок/інтеграції
  немає.
- Немає property-detail сторінок → notify-модалці немає хоста.
- Немає гейтів паритету Jekyll ↔ 11ty.
- Розбіжність рушія: один косметичний `cursor-pointer` у
  `themes/tailwind.js` (EL-1).

## Еталон паритету

Рушій має бути ідентичний файл-у-файл із Jekyll-копією (шляхи всередині
відрізняються префіксом `src/`). Перевірка: `scripts/parity.ps1`.
