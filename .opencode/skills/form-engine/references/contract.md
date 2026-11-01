# Контракт конфігурації

Джерело істини: `_form-engine/schema/form-config.schema.json` (draft-07).
Валідатор: `_form-engine/tools/validate-config.mjs`.

Конфіг — YAML, але **JSON-сумісний**: той самий об'єкт запечується в JSON-острівець
сторінки. Ніяких YAML-якорів, тегів, `<<:` чи multi-doc.

## Каркас

```yaml
version: 1            # const 1
id: add-property      # ^[a-z][a-z0-9_-]*$, мусить = ім'я _data/<id>.yml
settings: { ... }     # обов'язковий
steps: [ ... ]        # обов'язковий, minItems 1
submit: { ... }
behavior: { ... }
theme: bootstrap4     # або tailwind
chrome: { ... }
rates: { ... }
captcha: { ... }
assets: { ... }
```

`additionalProperties: false` на верхньому рівні: невідомий ключ — помилка.
`--strict` додатково ловить невідомі ключі всередині `field`.

## Геометрія

```text
steps[]
└── rows[]
    ├── fields[]              # варіант A
    └── cols[]
        └── rows[]            # варіант B (рекурсія)
            ├── fields[]
            └── cols[] ...
```

`row` приймає або `fields`, або `cols`. `row.auto: true` розподіляє поля по
брейкпойнтах; інакше — явний `cols[].class` (наприклад `col-12 col-md-6`).

`step`: `id` (обов'язковий), `rows` (обов'язковий), `title`, `class`.
`field`: `name`, `type`, `col`, `class`, `label`, `helper`, `placeholder`,
`feedback`, `validation`, `required`, `readonly`, `depends`, `value`, `html`,
`spellcheck`, `options`, `min`, `max`, `minlength`, `maxlength`, `pattern`,
`step`, `multiple`, `accept`, `autocomplete`, `autocapitalize`, `prepend`,
`append`, `variant`, `widget`, `fields`.

`field.type` — словник рендерера:

```text
text tel email number textarea select radio checkbox checkbox_group
autocomplete location region file widgets heading paragraph list alert
badge image raw hidden
```

## Умовні значення — головна ідея DSL

`min`, `max`, `pattern`, `required`, `label` — не літерали, а **відповіді,
вибрані умовами**.

```yaml
min:
  text: Максимум 99 кімнат
  depends:
    - field: property_type
      values: [commercial, garage]
      text: Максимум 500 приміщень
```

Умова (`$defs.condition`):

| Ключ | Значення |
| --- | --- |
| `field` | обов'язковий, ім'я поля |
| `values` | набір рівності |
| `value` | вираз порівняння, напр. `'>0'` |
| `except` | заперечення набору |
| `logic` | `and` / `or`, комбінує сусідів |
| `text` | копірайт для цієї гілки |
| `when` | вкладена умова-гейт |

Рівно одне з `values` / `value` / `except`. `conditionList` — одна умова або
масив умов.

`conditionalText` — рядок, або `{ text, depends, markdown }`, або список умов.
`label` — рядок або `{ text, markdown, depends, informer, icon }`.

## Submit і behavior

`submit`: `action`, `method`, `endpoint`, `captcha`, `success`, `error`,
`encoding`, `response`, `errors`.

`submit.action` має приоритет над site-ендпоінтом. Якщо його немає, Jekyll-плагін
бере `site.<id_з_підкресленнями>_endpoint` з `_config.yml`; порожній endpoint —
fatal build error.

`behavior`: `mode` (`page` за замовчуванням, `modal` для Notify), `modal`,
`seed`, `success`, `reset`.

## Відомі вади v1 (зафіксовані, не виправляти випадково)

1. `required` перевантажений: boolean **або** список умов («required поки...»).
2. `validation.message` — мертвий ключ; рендерер читає field-level `message`.
   Схема тримає його лише для сумісності.
3. Property-сторінки недетерміновані (`| sample` в SEO-синонімі) — порівнюється
   лише notify-фрагмент.
4. `type` необов'язковий у sub-field локаційного каскаду: рендерер вибирає
   search або select за `mode`/`threshold`.
5. Form-wide `pattern` потрапляє в `email` як атрибут, але валідатор email його
   ігнорує; `novalidate` робить атрибут інертним.
6. Невідомий оператор `compare` блокує значення (fail-closed).
7. `settings.validation[defKey]` — живий fallback-шар між копірайтом поля і
   хардкодом.

## Bake

```text
_data/<name>.yml --validate--> --gen-form-app--> _includes/form/app/<name>.html
```

Фрагмент містить: маркер свіжості, JSON-острівець, captcha, inline CSS/JS карти
й теми, chrome візарда, форму, addon-модалки, loader модуля.

Маркер: `<!-- form-bake name=<name> sha=<sha256> -->`. Хеш = конфіг + site-opts +
файли рушія. Незмінний фрагмент не перезаписується (щоб `jekyll serve` не
зациклювався).

Генератор відмовляється писати Liquid-делімітери: фрагмент рендериться Jekyll як
Liquid. Тому в конфігу й тему не можна вставляти `{{`, `{%`.
