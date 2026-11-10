# Гейти

Запускати з кореня репо. `T` = тести, `V` = валідація, `CA` = add-property,
`CN` = notify, `VR` = build-diff, `B` = 11ty build, `P` = parity.

## Jekyll (`realtyua/main`)

### T — тести

```powershell
npm test
# або без npm-скрипта:
node --test --test-force-exit --test-timeout=60000 --test-concurrency=2 "test/*.test.mjs"
```

`--test-force-exit` обов'язковий: рушій тримає відкриті ресурси. Тести — чисті
ES-модулі, DOM-стаби без jsdom.

Очікування: **214/214** на момент плану. Якщо число в README інше — README
застарілий, а не тести.

### V — конфіги

```powershell
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
```

YAML парсить Ruby `psych` (Jekyll і так вимагає Ruby), валідація — чистий Node,
без npm-залежностей. `--strict` ловить невідомі ключі; `field` навмисно
відкритий.

### CA — add-property parity

```powershell
node _form-engine/tools/check-add-property.mjs
# node _form-engine/tools/check-add-property.mjs --baseline _form-engine/baseline/add-property-old.txt
```

Три шари: copy parity, структура (ids/classes/widget hooks), id-контракт.
Baseline — **заморожений** знімок старої сторінки; він не оновлюється від
поточного рендера.

Поточний стан: **0 failures (PASS)** — після JEK-R3/JEK-R4 baseline reconciliation.
13 copy-drift прийняті через `ACCEPTED_COPY_EDITS` таблицю; `file-info` перевірка
інвертована (явний негативний контракт). Структурні перевірки (ids, classes,
widget hooks, no-Alpine) проходять. Не «лікувати» baseline наосліп — JEK-R3/R4.

> **Важливо:** Інструмент має рендерити з `theme: config.theme || 'bootstrap4'`,
> щоб поважати тему конфігу (Bootstrap 4 для add-property, Tailwind для demo).
> При портуванні на 11ty (EL-6) це виправлено:
> `FormRender.render(config, { theme: config.theme || 'bootstrap4' })`.

### CN — notify

```powershell
node _form-engine/tools/check-notify.mjs
node _form-engine/tools/check-notify.mjs _site
```

Потрібен зібраний `_site`. Сторінки шукаються **за вмістом**, не за шляхом,
тому працює і на повному, і на швидкому build. Перевіряє: mount, endpoint, обидва
JSON-острівці, `uid == ім'я файлу`, `app.js` є, legacy `notify.js` немає, рендер
у legacy-контракт, відсутність Alpine.

### VR — build-diff safety net

```powershell
powershell -File _form-engine/tools/verify-render.ps1 verify
powershell -File _form-engine/tools/verify-render.ps1 capture
powershell -File _form-engine/tools/verify-render.ps1 build
powershell -File _form-engine/tools/verify-render.ps1 verify -SkipBuild
```

- `verify` — build + порівняння, падає на будь-якому diff;
- `capture` — записати поточний output як baseline (свідомий акт);
- `build` — лише build;
- `-SkipBuild` — порівняти наявний `_site`.

Build швидкий: `bundle exec jekyll build --limit_posts 1 --trace --profile`
(~90 с замість 15+ хв). Три артефакти: `new.html`,
`assets/data/form-config.json`, notify-фрагмент реальної property-сторінки.

Нормалізації: `?v=\d+` і ISO-таймстемпи. **Не послаблювати** нормалізатор, щоб
«позбутися diff» — це маскує регресію.

Property-сторінка — пост, тому при появі новішого поста `verify` скаже
`NEW POST` і попросить re-capture. Сам він нову сторінку не приймає.
Після build wrapper також запускає `check-notify.mjs`.

## 11ty (`reifua/main`)

```powershell
npm test
npm run validate
npm run build
npm run check:add-property
```

- `B` — `npm run build` = `rimraf dist && cross-env NODE_ENV=production eleventy`;
- `npm run validate` — `validate-config.mjs src/_data/add-property.yml --strict`;
- `npm run check:add-property` — порт `check-add-property.mjs` (EL-6), очікує 0 failures;
- тести — той самий `node --test` набір (208/208 на момент плану).

Для повного паритету (Phase 5) знадобляться порти `check-notify`, freshness-тест і `parity.test.mjs` — їх ще немає.

## P — паритет рушія

```powershell
powershell -File .opencode/skills/form-engine/scripts/parity.ps1
```

Порівнює хеші файлів `assets/js/form-engine/**` (Jekyll) і
`src/assets/js/form-engine/**` (11ty). Очікування після EL-1: 0 розбіжностей.
До EL-1 відомий один косметичний diff у `themes/tailwind.js`.

## Швидкий прогін

```powershell
powershell -File .opencode/skills/form-engine/scripts/test.ps1
powershell -File .opencode/skills/form-engine/scripts/validate-all.ps1
```

## Що гейти **не** перевіряють

- ручний submit у браузері (див. notify smoke pass у `_form-engine/README.md`);
- візуальний вигляд обох тем;
- доступність (labels, aria, focus) — JEK-E4;
- повний Jekyll build (лише `--limit_posts 1`).
