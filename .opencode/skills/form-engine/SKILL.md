---
name: Form Engine
description: Декларативний Form Engine: YAML-конфіг, bake, теми Tailwind і Bootstrap 4, адаптери Jekyll та 11ty, гейти паритету
---

# Form Engine

Один рушій, один контракт конфігурації, дві платформи:

| | Jekyll | Eleventy |
| --- | --- | --- |
| Репо | `realtyua/main` (цей) | `reifua/main` (reference `reifua`) |
| Рушій | `assets/js/form-engine/**` | `src/assets/js/form-engine/**` |
| Конфіги | `_data/<name>.yml` | `src/_data/<name>.yml` |
| Вхід у сторінку | `{% include form/app/<name>.html %}` | `{% formApp "name" %}` |
| Адаптер | `_plugins/form_engine.rb` | `lib/form-engine.js` |

## Перед зміною

1. Прочитай `references/contract.md` — це контракт, а не порада.
2. Визнач шар: **runtime** / **theme** / **adapter** / **config** / **tests** / **docs**.
   Один work item — один шар і одна платформа (крім items паритету).
3. Перевір, чи файл не є **згенерованим**. Ніколи не редагуй вручну:
   - `_includes/form/app/*.html` (Jekyll, пише `gen-form-app.mjs`);
   - фрагменти, які повертає 11ty-адаптер (він тримає їх у пам'яті);
   - `assets/data/form-*.json`, якщо він запечений з конфігу.
4. Змінюй джерело: `_data/<name>.yml`, `assets/js/form-engine/**`,
   `assets/js/form-engine/themes/**`, адаптер або tool.

## Обов'язкова перевірка

Мінімум для будь-якої зміни рушія чи конфігу:

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
```

Додатково залежно від шару:

```powershell
node _form-engine/tools/check-add-property.mjs          # структура add-property
powershell -File _form-engine/tools/verify-render.ps1 verify   # Jekyll build-diff
```

Для 11ty (`reifua`):

```powershell
npm run build
npm test
npm run validate
```

Готові скрипти: `scripts/test.ps1`, `scripts/validate-all.ps1`, `scripts/parity.ps1`.

## Правила

- **Нічого не комітити**: без `git add`, `git commit`, `git push`, `git merge`,
  `git rebase`. Зміни лишаються в робочому дереві для користувача.
- **Все локально**: без `webfetch`, `websearch`, `git fetch/pull`, `npm install`,
  мережевих запитів.
- **UTF-8 без BOM** для кожного створеного/зміненого файлу.
- **Нічого без дозволу**: редагування, видалення, переміщення, запуск серверів і
  зміна конфігурації — лише після підтвердження. Read-only огляд дозволений.
- Конфіг **не знає сайту**: жодних URL, курсів, українського chrome-копірайту
  чи inline-асетів у `_data/*.yml`. Це знає лише адаптер.
- `id` конфігу мусить дорівнювати імені файлу `_data/<id>.yml`.
- Зміна runtime проходить тести на **обох** темах.
- Theme-специфічний клас не потрапляє в glue: glue селектить лише спільні
  hooks (`custom-file`, `dropdown-menu`, `file-previews`, `mt-2`, ...).
- Жодних Alpine-атрибутів (`x-*`, `@*`, `:*`) у рендері — це перевіряють гейти.
- Невідомий оператор `compare` навмисно блокує значення (fail-closed).
- Якщо під час роботи знайшлося щось поза scope — новий work item, не
  розширення поточного.

## Куди дивитися

| Питання | Файл |
| --- | --- |
| Форма конфігу, DSL, відомі вади | `references/contract.md` |
| Jekyll: hook, include, site-opts, generated | `references/jekyll-adapter.md` |
| 11ty: shortcode, beforeBuild, passthrough | `references/eleventy-adapter.md` |
| Гейти, команди, відомі failures | `references/gates.md` |
| Теми, hooks, Bootstrap ↔ Tailwind | `references/theming.md` |
| План, фази, work items | reference `plan` або `docs/form-engine/WORKITEMS.md` |
