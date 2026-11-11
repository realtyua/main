# EL-7 — Порт `check-notify`

Phase: 5 · Depends: EL-4 · Repo: reifua
Branch: `feat/EL-7-check-notify` · Worktree: `X:/OpenCodeData/opencode/worktree/b25e23/EL-7-check-notify` (фактичний; див. handoff log)

Status: `review`

## Goal

Портити Jekyll-інструмент `_form-engine/tools/check-notify.mjs` у reifua. Інструмент валідує notify-фрагмент:
- присутність обов'язкових полів (honeypot, timestamp, uid, property_url, property_email, property_title, reason, details, captcha)
- коректність endpoint
- відсутність Alpine-атрибутів
- відповідність baseline `_form-engine/baseline/notify.html`

## Files

- `_form-engine/tools/check-notify.mjs` — **новий/порт** з Jekyll
- `_form-engine/baseline/notify.html` — **новий** baseline (створити з поточного виводу reifua після EL-4)
- `package.json` — скрипт `check:notify` → `node _form-engine/tools/check-notify.mjs`

## Steps

1. `session_move` на `reifua/main`, worktree `../worktrees/EL-7-check-notify`, гілка `feat/EL-7-check-notify`, junction `node_modules`
2. Baseline: `npm test`, `npm run validate`, `npm run build` до змін
3. Портнути Jekyll `check-notify.mjs` → reifua (шляхи, baked fragment extraction)
4. Згенерувати baseline: збудувати сторінку оголошення (або тестову), витягнути notify modal HTML, зберегти в `_form-engine/baseline/notify.html`
5. Додати npm script `check:notify`
6. Запустити — має пройти (0 failures) або показати відомі drift-и, якщо є
7. Гейти item

## Acceptance

- `_form-engine/tools/check-notify.mjs` запускається і перевіряє notify fragment
- `_form-engine/baseline/notify.html` існує і відповідає поточному reifua виводу
- `npm run check:notify` працює
- Тести reifua зелені

## Gates

`T` (reifua `npm test`), `V` (`npm run validate`), `B` (`npm run build`), `CN` (`npm run check:notify`).

```powershell
npm test
npm run validate
npm run build
npm run check:notify
```

## Out of scope

- Freshness + parity-тест Jekyll ↔ 11ty — EL-8.
- Виправлення drift (окремі item-и).

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-11: Session started. `session_move` розмістила worktree в OpenCode-керованому `X:/OpenCodeData/opencode/worktree/b25e23/EL-7-check-notify` (відхилення від запланованого `../worktrees/EL-7-check-notify`). Гілка `feat/EL-7-check-notify` від `db1f95f` (tip `feature/form-engine`, включає EL-6). Junction `node_modules` → `C:/Users/Vasyl/Documents/GitHub/reifua/main/node_modules` (абсолютний шлях — відносний не резолвиться з `X:`).
- 2026-11-11: Baseline gates до змін: `npm test` (239 pass), `npm run validate` (valid), `npm run build` (success; 10 сторінок оголошень несуть `id="notifyModal"`).
- 2026-11-11: Портовано `_form-engine/tools/check-notify.mjs` з Jekyll `realtyua/main/_form-engine/tools/check-notify.mjs` (faithful port, ассерти не послаблені):
  - Site dir `_site/` → `dist/` (default, перевизначається аргументом); engine import `../../assets/js/form-engine/render.js` → `../../src/assets/js/form-engine/render.js`.
  - Усі Jekyll-ассерти збережено 1:1: endpoint (`notify-worker`), mount `#notify-app`, обидва JSON-острови парсяться, config `id`/`version`/`steps`, ключі page-острова (`uid`, `property_url`, `property_email`, `property_title`), uid у шляху, module include `form-engine/app.js`, відсутність legacy `notify.js`, render-контракт (`id="notify-form" method="POST"`, action=endpoint, `novalidate`/`data-form="notify"`, honeypot, hidden inputs, reason select), без Alpine.
  - Render-перевірка передає `{ theme: config.theme || 'bootstrap4' }` — як 11ty-glue (`bootPage`/`bootModal` беруть тему з острова); Jekyll рендерив без теми (bootstrap4 за замовчуванням). Сьогодні поведінково ідентично.
- 2026-11-11: Створено `_form-engine/baseline/notify.html` (5861 chars, UTF-8 без BOM): заморожений зріз збудованої модалки — збалансований `<div class="modal fade" id="notifyModal">…</div>` з `dist/apartment/city-loft/index.html`. Конвенція як у EL-6 `add-property.html` (raw fragment, без header-коментаря). Як і в Jekyll-оригіналі, гейт не дифає цей baseline (у Jekyll порівняння з baseline теж немає); файл документує фактичний вивід. Перевірено: повторний витяг зі свіжої збірки байт-у-байт збігається.
- 2026-11-11: Додано npm script `check:notify` → `node _form-engine/tools/check-notify.mjs` (після `check:add-property`).
- 2026-11-11: Гейти item після змін:
  - `npm test`: 239 pass, 0 fail
  - `npm run validate`: valid
  - `npm run build`: success
  - `npm run check:notify`: **RED — 40 failures across 10 pages** — очікуваний результат faithful port (4 distinct × 10 сторінок):
    1. `config.id is undefined, expected "notify"`
    2. `config.version is undefined, expected 1`
    3. `rendered form lost id="notify-form" method="POST"`
    4. `rendered form lost novalidate/data-form="notify"`
- 2026-11-11: Корінь drift (досліджено linkedom boot-probe, НЕ виправлено — поза scope item): `lib/form-engine.js` `notifyConfigIsland` витягує JSON `#notify-config` із запеченого `renderPage`-фрагмента, де острів = `{theme, settings, steps, rates, chrome}` — без `id`, `version`, `behavior`. Jekyll шипає повний конфіг (`site.data.notify | jsonify`). Наслідки: `app.js` маршрутизує острів у `bootPage` (не `bootModal`), змонтована форма отримує `id="form-form"`/`data-form="form"` замість `id="notify-form"`/`data-form="notify"`; CN render-ассерти падають з тієї ж причини. Кандидат на окремий item: `notifyConfigIsland` має серіалізувати `src/_data/notify.yml` (повний конфіг з `id`/`version`/`behavior`), як у Jekyll.
- 2026-11-11: Усі інші CN-ассерти зелені на всіх 10 сторінках: endpoint `https://notify-worker.sparkling-union-9e0a.workers.dev`, острови парсяться, steps присутні, page-острів має всі 4 ключі, `property_url` непорожній, uid відповідає шляху, module include `form-engine/app.js?v=099fb082fd60`, немає legacy `notify.js`, honeypot/hidden inputs/reason select у render, немає Alpine.
- 2026-11-11: Leftovers: тимчасові скретч-файли видалено (`el7-extract.mjs`, `el7-boot-probe.mjs` в temp-каталозі OpenCode). Junction `node_modules` треба прибрати ДО `worktree_remove`. Помічено (поза scope EL-7, для follow-up): mojibake досі є в EL-6 `_form-engine/tools/check-add-property.mjs` (рядки 122–124 template literals, рядок 146 коментар), хоча handoff EL-6 стверджує виправлення — latent (спрацьовує лише для конфігів без явного `file.infoLine`); рядок EL-6 у реєстрі не синхронізовано з комітом `db1f95f` (статус `review`, commit `—`).
- 2026-11-11: Ready for review. Commit SHA: (agent does not commit).
- 2026-11-11: Огляд завершено — користувач обрав «прийняти як є» (порт з вірними ассертами, drift документовано). За явним дозволом користувача агент виконав коміт і merge (разовий override правила «agent does not commit»): item commit `bb0fc36` на `feat/EL-7-check-notify`, merge `--no-ff` `8566386` у `feature/form-engine`. На виправлення `notifyConfigIsland` створено item EL-10.