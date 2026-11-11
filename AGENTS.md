# AGENTS.md — realtyua / Form Engine

Цей репозиторій — Jekyll-сайт `realty.ua` з декларативним Form Engine.
Його 11ty-двійник — `reifua/main` (reference `reifua`): той самий рушій,
адаптер `{% formApp %}`. План робіт — reference `plan`
(`~/.opencode/plan/form-engine-plan.md`), реєстр — `docs/form-engine/WORKITEMS.md`.

## Політика роботи (обов'язково)

1. **Нічого не комітити (not commit).** Жодних `git add`, `git commit`,
   `git push`, `git merge`, `git rebase`, `git reset --hard`, тегів чи
   force-push. Усі зміни лишаються в робочому дереві; staging і коміт робить
   користувач.
2. **Все робимо локально.** Без мережі: `webfetch`, `websearch`,
   `git fetch/pull/push`, `npm install`, `curl`, `wget`, `Invoke-WebRequest`,
   cloud API. Лише локальні файли, локальні reference-теки й уже встановлені
   залежності. Потрібна мережа — зупинитися й запитати.
3. **Кодування тільки UTF-8.** Кожен створений або змінений файл — UTF-8 без
   BOM. Не писати в CP1251/ANSI/UTF-16/Latin-1. Після роботи перевірити
   читабельність як UTF-8. Проєктний `.editorconfig` фіксує `charset = utf-8`.
4. **Нічого не робити без дозволу.** Спочатку запитати, потім робити:
   редагування, створення, видалення, переміщення файлів, встановлення пакетів,
   запуск серверів, зміна конфігурації. Read-only огляд файлів дозволений.
   Сумнів щодо scope або наслідків — зупинитися й запитати.

## Швидкі факти

- Jekyll + Ruby 3.4, Node 24.
- Тести: `npm test` (або `node --test --test-force-exit --test-timeout=60000 --test-concurrency=2 "test/*.test.mjs"`).
- YAML парсить Ruby `psych`; валідатор і тести — чистий Node.
- Повний Jekyll build > 15 хв. Для перевірок — `--limit_posts 1` (~90 с).
- `_form-engine/` — джерела, схема, tools, baseline. Jekyll її не публікує.

## Структура

| Шлях | Призначення |
| --- | --- |
| `_data/<name>.yml` | Конфіг форми (джерело істини) |
| `_includes/form/app/<name>.html` | **Generated** фрагмент (не редагувати) |
| `_plugins/form_engine.rb` | Jekyll hook: знайти, провалідувати, запечи |
| `_form-engine/schema/form-config.schema.json` | Контракт конфігу |
| `_form-engine/tools/` | Валідатор, bake, гейти, build-diff |
| `_form-engine/baseline/` | Заморожені знімки для гейтів |
| `assets/js/form-engine/` | Runtime: entry, glues, renderer, controller, binder |
| `assets/js/form-engine/themes/` | Bootstrap 4 і Tailwind (markup + CSS) |
| `test/*.test.mjs` | `node --test` suites |
| `_includes/modals/notify-property.html` | Робоча Notify-модалка |
| `docs/form-engine/` | Реєстр і item-файли |
| `.opencode/skills/form-engine/` | Скіл: контракт, адаптери, гейти, теми |

## Конвеєр

```text
_data/<name>.yml
  └── {% include form/app/<name>.html %} у сторінці  ← opt-in
      └── post_read: validate --strict → gen-form-app.mjs
          └── _includes/form/app/<name>.html (маркер form-bake)
              └── assets/js/form-engine/app.js у браузері
                  └── bootPage / bootModal → renderPage → FormRender.mount
```

Форму запечують лише якщо її хтось include-ить. Notify не проходить цей шлях:
модалка кладе JSON-острівці, `app.js` бачить `behavior.mode: modal`.

## Ніколи не редагувати

- `_includes/form/app/*.html` — generated, правка зникне на build.
- `assets/data/form-*.json` — запечений конфіг для воркера.
- `_site/**`.
- `_form-engine/baseline/**` — це доказ, а не поточний стан. Оновлення baseline —
  свідомий акт з переглядом кожної розбіжності.

## Заборони

- Не комітити, не пушити, не merge-ити — див. «Політика роботи».
- Не додавати site-специфіку (URL, курси, копірайт, inline-асети) у `_data/*.yml`.
  Це робить адаптер (`site-opts.mjs` для Jekyll, `lib/form-engine.js` для 11ty).
- Не додавати Alpine-атрибути (`x-*`, `@*`, `:*`) у рендер.
- Не «лікувати» baseline, щоб позеленіти гейт.
- Не послаблювати нормалізатор `verify-render`, щоб прибрати diff.
- Не змінювати `theme` у конфігу, щоб пройшов тест.
- Не розширювати scope item-а; нове знахідка → новий ID.

## Гейти

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
node _form-engine/tools/check-notify.mjs
powershell -File _form-engine/tools/verify-render.ps1 verify
```

Деталі й поточні очікування — `.opencode/skills/form-engine/references/gates.md`.
Стан на 2026-11-01: 214/214 тестів, 3/3 конфіги валідні, `check-add-property`
має 14 відомих failures (13 copy-drift + `file-info`).

## Work items і сесії

- Один item = одна сесія = одна гілка `feat/<ID>-<slug>` = один worktree
  `../worktrees/<ID>-<slug>`.
- `worktree_create` створює worktree в **detached HEAD** → одразу всередині
  нього `git checkout -b feat/<ID>-<slug>`. Без цього коміти item-а не
  прив'язані до гілки.
- У worktree немає `node_modules`. Для гейтів — junction на канонічний:
  `cmd /c mklink /J node_modules ..\..\main\node_modules`. `npm install`
  заборонений (офлайн-політика). Junction знімати **до** `worktree_remove`.
- Після прибирання worktree сесію item-а паркувати в репо предмета item-а:
  EL-* → `reifua/main`, JEK-* → `realtyua/main`.
- Старт: `/item <ID>`. Агент читає `WORKITEMS.md` + `docs/form-engine/items/<ID>.md`.
- Baseline-гейти **до** змін, гейти item — після.
- Handoff дописується в item-файл, статус — у `WORKITEMS.md`.
- Агент **не** комітить, не пушить і не merge-ить. Це робить користувач після
  перегляду змін.

## Коміти

```text
<ID>: <short imperative>
chore(opencode): project config, skills, agent instructions, workitem registry
feat(form-engine): declarative runtime, Jekyll adapter, configs, tests
```

Один item — один логічний коміт. Setup OpenCode і рушій — окремі коміти.
Це конвенція для користувача: агент коміти не створює.

## Де шукати далі

- Контракт DSL: `.opencode/skills/form-engine/references/contract.md`
- Jekyll-адаптер: `.../references/jekyll-adapter.md`
- 11ty-адаптер: `.../references/eleventy-adapter.md`
- Теми: `.../references/theming.md`
- Архітектура рушія: `_form-engine/README.md` (місцями застарілий — JEK-R6)
- 11ty-двійник: `reifua/main` (`src/assets/js/form-engine`, `lib/form-engine.js`)
