# JEK-R2 — `url` + `property_url` у notify

Phase: 3 · Depends: BASE-5 · Repo: realtyua
Branch: `feat/JEK-R2-notify-url` · Worktree: `../worktrees/JEK-R2-notify-url`

Status: `done`

## Goal

`site.url` має бути заданий у `_config.yml`, щоб notify-модалка віддавала
**абсолютний** `property_url` (`https://www.realestate.if.ua/...`), а canonical,
`og:url` і `shortlink` на сторінках були абсолютними — як того очікує
заморожений baseline `verify-render`.

## Files

- `_config.yml` (рядок 3) — розкоментувати `url: 'https://www.realestate.if.ua'`.
- `_includes/modals/notify-property.html` — **не змінювати**: там уже
  `page.url | absolute_url`, який почне давати абсолютний URL після `site.url`.

## Контекст дефекту

- `_config.yml:3` зараз містить `#url: 'https://www.realestate.if.ua'`.
- `_includes/modals/notify-property.html:21` формує
  `"property_url": {{ page.url | absolute_url | jsonify }}`.
- Без `site.url` Jekyll повертає відносний шлях (`/district/...`), тож у листі
  з notify посилання на оголошення некоректне.
- Baseline `_form-engine/baseline/new.html.txt` і
  `.../district__town__kosiv__apartment__prodam-1789988154.html.txt` уже
  містять `https://www.realestate.if.ua/...` — вони були зняті з `url` заданим.
  Саме тому `verify-render` бачить pre-existing diff.

## Steps

1. Worktree та гілка `feat/JEK-R2-notify-url` (detached HEAD → checkout).
2. У worktree зробити junction `node_modules` на `../../main/node_modules`
   (без `npm install`).
3. Baseline-гейти до змін: `npm test`, три `validate-config --strict`,
   `verify-render.ps1 verify` (зафіксувати наявні розбіжності).
4. Розкоментувати `url` у `_config.yml`. Жодних інших правок.
5. Гейти після змін: `npm test`, три `validate-config --strict`,
   `verify-render` (build + порівняння + `check-notify`).
6. Перевірити `_site`:
   - `new.html`: `shortlink`, `canonical`, `og:url` — абсолютні;
   - property-фрагмент: `"property_url": "https://www.realestate.if.ua/..."`;
   - у diff проти baseline не лишилося URL-розбіжностей.
7. Handoff + оновити `docs/form-engine/WORKITEMS.md`.

## Acceptance

- `_config.yml` містить рівно `url: 'https://www.realestate.if.ua'` (без `#`),
  інші ключі не змінені.
- `_site/new.html`: `shortlink`, `canonical`, `og:url` починаються з
  `https://www.realestate.if.ua`.
- Property-сторінка: `#notify-page.property_url` — абсолютний
  `https://www.realestate.if.ua/<шлях>`.
- `verify-render.mjs verify`: notify-фрагмент — `ok`; у `new.html` немає
  URL-розбіжностей. Решта розбіжностей `new.html` — pre-existing артефакти:
  `form-bake sha=` (freshness-ключ включає `_config.yml`), copy-drift
  апострофа (JEK-R3) і `?v=` engine digest (EOL, JEK-R8); плюс
  `assets/data/form-config.json` (JEK-R3).
- `npm test` — без регресій (у канонічному чекауті 214/214).
- Усі 3 конфіги валідні (`--strict`).
- Baseline не перезаписаний; generated-файли не редаговані.

## Gates

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
powershell -File _form-engine/tools/verify-render.ps1 verify
```

`verify-render.ps1` після build запускає `check-notify.mjs`. На HEAD він падає
на pre-existing `missing the form-engine/app.js module include` для
property-сторінки (окремий дефект, не JEK-R2). Для перевірки diff-у слід
додатково запускати `node _form-engine/tools/verify-render.mjs verify`.

## Out of scope

- Відсутній `form-engine/app.js` на property-сторінках і червоний
  `check-notify` — окрема знахідка, потребує нового ID.
- Дубль `_includes/form/notify-property.html`, сирота
  `_includes/form/app/notify.html`, застарілий коментар у модалці — JEK-R5.
- Copy-drift і `file-info` у `check-add-property` — JEK-R3/R4.
- Перегенерація baseline — заборонена без свідомого рішення.
- Зміна `domain`, `baseurl`, endpoint-ів або будь-яких інших ключів `_config.yml`.
- EOL-нормалізація — JEK-R8.
- `reifua` (11ty) — EL-4.

## Handoff log

- 2026-11-03: Створено item зі `_TEMPLATE.md` (файл був відсутній).
  Початок сесії JEK-R2.
- 2026-11-04: Baseline до правок. У свіжому worktree `npm test` спершу падав
  на CRLF-vs-LF у `test/form-app-fresh.test.mjs` (checkout `core.autocrlf=true`);
  після першого offline-build — 214/214. Конфіги — 3/3 valid.
  `verify-render.mjs verify`: `new.html` (URL), notify-фрагмент
  (`property_url`) і `form-config.json` (JEK-R3). `check-notify` —
  pre-existing `missing the form-engine/app.js module include`.
- 2026-11-04: Змінено лише `_config.yml:3`:
  `#url: 'https://www.realestate.if.ua'` → `url: 'https://www.realestate.if.ua'`.
  Інші ключі не чіпано.
- 2026-11-04: Build офлайн (`--limit_posts 1`, тимчасовий override
  `jekyll_get_json: []` поза репо). `_site/new.html`: `shortlink`,
  `canonical`, `og:url` = `https://www.realestate.if.ua/...`. Property-сторінка:
  `#notify-page.property_url` — абсолютний `https://www.realestate.if.ua/...`.
- 2026-11-04: Гейти після правки: `npm test` — 214/214; 3/3 конфіги valid;
  `verify-render.mjs verify` — notify-фрагмент **ok**, URL-розбіжностей немає.
  `new.html` лишається CHANGED, але вже не через URL: (а) `form-bake sha=` —
  freshness-ключ включає `_config.yml`, тож після розкоментування `url` його
  зміна неминуча; (б) copy-drift апострофа `'` → `’` (JEK-R3); (в) `?v=` engine
  digest — EOL-артефакт worktree (JEK-R8). Масковане порівняння (`sha=`/`?v=`)
  дає notify-фрагмент **identical**, а в `new.html` лишає тільки апостроф JEK-R3.
- 2026-11-04: `check-notify` досі падає лише на pre-existing
  `missing the form-engine/app.js module include` (окремий дефект, не JEK-R2).
- 2026-11-04: Generated `_includes/form/app/add-property.html` після build
  змінено лише в `sha=`/`?v=`; відкочено до `HEAD`, у diff не входить.
  Baseline не перезаписувався.
- 2026-11-04: Commit SHA: немає (агент не комітить; staging/commit/merge —
  користувач).
- 2026-11-05: Закрито. Item-коміт `3044fe03` (`JEK-R2: absolute site url for
  canonical and notify links`); merge у `feature/form-engine`: `f08d1ea3`
  (`--no-ff`). Worktree прибрано; статус у реєстрі — `done`.
