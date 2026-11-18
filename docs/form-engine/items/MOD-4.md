# MOD-4 — Cloudflare: Worker-endpoint для форм, зона `rent.if.ua`, Turnstile

Phase: 8 · Depends: MERGE-1 · Repo: reifua (+ Cloudflare)

Branch: `feat/MOD-4-cloudflare-forms` · Worktree: `reifua/main`
(окремий worktree не потрібен: зміни в `workers/forms/`, `src/**` і
`eleventy.config.mjs`; гейти виконуються в `main`)

Status: `blocked`

> `blocked`: рішення ухвалені (нижче), але для старту бракує доступу до
> Cloudflare та адрес доставки. Блокери — у розділі «Що потрібно від
> користувача».

## Goal

1. Форми сайту (`add-property`, `notify`) надсилаються на **один
   Cloudflare Worker endpoint** `https://forms.rent.if.ua`, який приймає
   payload рушія, серверно перевіряє Turnstile і повертає контракт
   `{success}` / `{code}` / `{errors}`. Доставка — та сама, що на
   `realestate.if.ua` (Cloudflare Email `send_email`), але з адресами
   `rent.if.ua`.
2. Домен `rent.if.ua` (і `www.rent.if.ua`) обслуговується Cloudflare: зона
   активна, записи GitHub Pages збережені (DNS-only), apex і `www`
   відкривають сайт по HTTPS без зламаного сертифіката.
3. Turnstile увімкнено для `rent.if.ua` / `www.rent.if.ua`: sitekey — у
   конфігах/`site.js`, secret — лише в Worker-і; токен перевіряється на
   сервері з `action` і `hostname`.

## Рішення користувача (2026-11-18)

| Питання | Рішення |
| --- | --- |
| Акаунт Cloudflare | Той самий, де живуть `add-property-worker` / `notify-worker` (`sparkling-union-9e0a`) |
| Доступ | API token через env: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`; `wrangler` дозволено |
| Код Worker-а | `workers/forms/` у `reifua/main` |
| Доставка | Як на `realestate.if.ua` (`realtyua/main/workers/*`), але окремо для `rent.if.ua`: `info@rent.if.ua`, sender `noreply@send.rent.if.ua`, Email Routing уже працює |
| Endpoint | `https://forms.rent.if.ua` (Custom Domain Worker-а) |
| DNS / NS | `rent.if.ua` → Cloudflare NS (пару дає агент, змінює користувач), записи GitHub Pages — **DNS-only** (сіра хмара) |
| Turnstile | Новий widget; secret вставляє користувач; captcha також для `/demo` |

## Поточний стан (факти з репо)

- `reifua/main` деплоїться на GitHub Pages; `CNAME` = `www.rent.if.ua`;
  remote — `https://github.com/reifua/main.git`.
- `src/_data/site.js`:
  - `addPropertyEndpoint: 'https://add-property-worker.sparkling-union-9e0a.workers.dev'`
  - `notifyEndpoint: 'https://notify-worker.sparkling-union-9e0a.workers.dev'`
  - `demoEndpoint: '/api/demo'` (заглушка, реального обробника немає)
- `add-property.yml` / `demo.yml` мають captcha-віджет
  (`action: add_property`, `token: cf-turnstile-response`), але **без**
  top-level `captcha:`, тому `runtime/shell.js` не додає Turnstile-блок
  (`turnstile && turnstile.enabled && flags.captcha`) і віджет показує
  локальний notice.
- `notify.yml` — modal-форма з raw-HTML `#turnstile-widget`, але
  `src/_includes/partials/notify-modal.njk` вставляє лише island і
  `app.js`: `captcha.js`, `window.TURNSTILE_CONFIG` і Turnstile `api.js`
  не підключаються, тому `modal-form.js` бачить `window.CaptchaSite`
  відсутнім і надсилає порожній токен.
- **У `reifua` немає маніфесту форми.** `dist/assets/data/` містить лише
  `districts.json` та `if.json`. Worker `form-validation.js` у `realtyua`
  читає `https://www.realestate.if.ua/assets/data/form-config.json`, який у
  Jekyll генерується Liquid-шаблоном `assets/data/form-config.json` з
  `_data/add-property.yml`. Для `reifua` еквівалент треба згенерувати на
  етапі Eleventy-збірки.
- Локального коду Worker-ів у `reifua` немає (`wrangler.toml` не знайдено).
- Reference-реалізація (не змінюємо): `realtyua/main/workers/`
  - `turnstile.js` — CORS, `jsonResponse`, `verifyTurnstile`,
    `checkSpamTraps`, `loadManifest`, `siteHostname`;
  - `add-property-worker.js` — multipart/JSON, ліміти фото, email;
  - `notify-worker.js` — JSON, honeypot/timestamp, email;
  - `form-validation.js` — валідація маніфесту + тіло листа.

## Контракт Worker-а (з рушія)

### `add-property` — page-форма

`POST` `multipart/form-data` на `data-endpoint`:

- `cf-turnstile-response` — токен captcha;
- `data` — JSON-рядок зі значеннями форми;
- `images` — файли (до 4, `image/*`, сумарно ≤ 2 MB у reference-коді;
  клієнтський ліміт — 4 × 5 MB).

Відповідь — JSON:

- `{ "success": true }`;
- `{ "success": false, "errors": { "<field>": "текст" } }` — помилки полів;
- `{ "success": false, "code": "E_..." }` — загальна помилка.

### `notify` — modal-форма

`POST` `application/json` (preflight → CORS):

- поля форми + службові `honeypot`, `timestamp`, `uid`, `property_url`,
  `property_email`, `property_title`, `reason`, `details`;
- `cf-turnstile-response`.

Відповідь — той самий JSON-контракт.

### Коди, які рушій уже вміє показувати

`E_CAPTCHA`, `E_CAPTCHA_REQUIRED`, `E_CAPTCHA_INVALID`, `E_CAPTCHA_REUSED`,
`E_CAPTCHA_MALFORMED`, `E_CAPTCHA_ACTION`, `E_CAPTCHA_HOSTNAME`,
`E_CAPTCHA_UNAVAILABLE`, `E_CONTENT_TOO_LARGE`, `E_TOO_MANY_ATTACHMENTS`,
`E_ATTACHMENT_TYPE_INVALID`, `E_RATE_LIMIT_EXCEEDED`, `E_DAILY_LIMIT_EXCEEDED`.

### CORS

Endpoint `forms.rent.if.ua` відрізняється від `https://www.rent.if.ua`,
тому Worker мусить:

- відповідати на `OPTIONS` (preflight) з
  `Access-Control-Allow-Origin: *` (як reference; без credentials),
  `Access-Control-Allow-Methods: POST, OPTIONS`,
  `Access-Control-Allow-Headers: Content-Type`;
- додавати `Access-Control-Allow-Origin` до всіх відповідей.

## План робіт

### A. Зона `rent.if.ua` і DNS

1. Додати зону `rent.if.ua` в акаунт (API token), отримати пару
   nameserver-ів; користувач змінює NS у registrar.
2. **До** зміни NS зняти поточні записи (`A`, `AAAA`, `CNAME`, `MX`, `TXT`,
   `CAA`, піддомени) — `Resolve-DnsName`/`dig`; після активації зони
   відтворити їх у Cloudflare.
3. GitHub Pages:
   - `www` → CNAME `reifua.github.io` (DNS-only);
   - apex `rent.if.ua` → A `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153` (DNS-only) — або лишити
     CNAME-flattening, якщо він не ламає HTTPS;
   - `CNAME`-файл у репо лишається `www.rent.if.ua`.
4. Перевірити HTTPS і редирект apex ↔ `www` без циклів; увімкнути
   «Enforce HTTPS» у GitHub Pages.
5. `forms.rent.if.ua` — Custom Domain Worker-а (Cloudflare створить
   proxied-запис; це єдиний запис, який має бути orange).

### B. Worker `workers/forms/`

```
workers/forms/
  wrangler.toml          # name = "rent-forms", main = "src/index.js"
  package.json           # devDependency: wrangler (окремий від сайту)
  README.md              # deploy, secrets, bindings, smoke
  src/index.js           # OPTIONS / multipart -> add-property / JSON -> notify
  src/turnstile.js       # адаптація realtyua: ALLOWED_HOSTNAMES, MANIFEST_URL
  src/form-validation.js # без змін з realtyua
  src/add-property.js    # адаптація realtyua/add-property-worker.js
  src/notify.js          # адаптація realtyua/notify-worker.js
```

1. Роутинг одного Worker-а:
   - `OPTIONS` → CORS;
   - `POST ?form=demo` → перевірка Turnstile з `action: 'demo'` →
     `{success:true}` без email;
   - `POST` + `multipart/form-data` → `add-property`;
   - `POST` + `application/json` → `notify`;
   - інше → `405` / `E_METHOD`.
2. `turnstile.js`: `ALLOWED_HOSTNAMES = ['www.rent.if.ua', 'rent.if.ua']`,
   `MANIFEST_URL = 'https://www.rent.if.ua/assets/data/form-config.json'`.
3. `add-property`: маніфест → `captcha.action`, `validateManifest`,
   `buildSubmissionBody`; ліміти фото; лист із вкладеннями через
   `env.EMAIL.send(...)`.
4. `notify`: honeypot/timestamp → `E_SPAM`/`E_RATE_LIMIT_EXCEEDED`, лист
   без вкладень.
5. `wrangler.toml`:
   - `name = "rent-forms"`, `main = "src/index.js"`, `compatibility_date`;
   - `[vars]` `MAIL_FROM`, `MAIL_REPLY_TO`, `NOTIFY_EMAIL`,
     `ADD_PROPERTY_EMAIL`;
   - `[[send_email]] name = "EMAIL"` + `destination_address` (якщо
     встановлена версія `wrangler` це підтримує; інакше binding `EMAIL`
     створюється в dashboard, як у `realtyua`);
   - Custom Domain `forms.rent.if.ua` (через `routes` з
     `custom_domain = true` або dashboard).
6. Секрети: `wrangler secret put TURNSTILE_SECRET_KEY` вставляє
   **користувач**; у git/чат secret не потрапляє.
7. Деплой: спершу `*.workers.dev` для smoke, потім Custom Domain після
   активації зони.
8. `.gitignore`: `workers/forms/node_modules/`, `workers/forms/.wrangler/`,
   `.dev.vars`.

### C. Маніфест форми для Worker-а

1. Додати в `eleventy.config.mjs` побудову маніфесту з
   `src/_data/add-property.yml` (той самий shape, що Liquid-генератор
   `realtyua/assets/data/form-config.json`):
   `fields` (усе, крім `type: widgets`), `location` (поля location-віджета),
   `locationWidget`, `captcha` (сам віджет, разом з `action`), `settings`.
2. Віддати його як `/assets/data/form-config.json` (окремий `.njk` з
   `permalink` і `eleventyExcludeFromCollections`, або global data +
   шаблон), не конфліктуючи з passthrough-copy `src/assets/data/`.
3. Додати тест (напр. `test/form-manifest.test.mjs`): `fields` непорожні,
   `captcha.action === 'add_property'`, `locationWidget === 'location_widget'`,
   маніфест валідний JSON після build.

### D. `site.js`, Turnstile і конфіги

1. `src/_data/site.js`:
   - `addPropertyEndpoint: 'https://forms.rent.if.ua'`
   - `notifyEndpoint: 'https://forms.rent.if.ua'`
   - `demoEndpoint` — без змін (заглушка);
   - `turnstile: { enabled: true, sitekey, language: 'uk-ua', ... }` для
     notify-модалки.
2. `add-property.yml` — top-level:
   ```yaml
   captcha:
     enabled: true
     sitekey: '<PUBLIC_SITEKEY>'
     language: 'uk-ua'
     localHosts: [localhost, 127.0.0.1]
   ```
   (`renderPage` бере `config.captcha`; адаптер не передає `opts.turnstile`).
3. `notify-modal.njk` — умовний Turnstile-блок (як `_includes/head.html`
   у `realtyua`): `window.TURNSTILE_CONFIG`, `captcha.js`,
   `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`.
   `captcha.js` сам вимикається на `localHosts`.
4. `demo.yml` — captcha **вмикаємо** (рішення користувача):
   - top-level `captcha:` як в `add-property.yml`;
   - `action: demo` у captcha-віджеті;
   - `site.js`: `demoEndpoint: 'https://forms.rent.if.ua/?form=demo'`;
   - Worker на `?form=demo` перевіряє Turnstile з `action: 'demo'` і
     повертає `{success:true}` **без** email (демо не створює заявок).
     Якщо потрібна доставка демо-заявок — окреме рішення.
5. Оновити тести/`verify:render` baseline, якщо Turnstile-блок змінює
   baked HTML (`add-property-page`, `render*`, `freshness`).

## Acceptance

- [ ] Зона `rent.if.ua` активна в Cloudflare, NS замінені; `www` і apex
      відкривають сайт по HTTPS, `forms.rent.if.ua` веде на Worker
- [ ] `MX`/`TXT`/`CAA`/піддомени збережені (порівняння DNS до/після)
- [ ] Worker приймає multipart (add-property) і JSON (notify), повертає
      контракт рушія, має CORS + `OPTIONS`
- [ ] Turnstile перевіряється на сервері (`success`, `action`, `hostname`);
      порожній токен → `E_CAPTCHA_REQUIRED`, чужий host → `E_CAPTCHA_HOSTNAME`
- [ ] `/demo` показує Turnstile, надсилає на `?form=demo` і отримує
      `{success:true}` без email
- [ ] `/assets/data/form-config.json` віддається сайтом і читається Worker-ом
- [ ] Sitekey у конфігах, secret — лише в Worker-і; у git секретів немає
- [ ] `src/_data/site.js` вказує на `https://forms.rent.if.ua`
- [ ] Гейти `reifua`: build 0, `T` 238/238 (+ новий маніфест-тест), `V`
      valid, `CA` PASS, `CN` ok, `VR` (re-baseline за потреби)
- [ ] Ручний smoke: реальні `add-property` і `notify` з
      `www.rent.if.ua` доходять до адресата; без captcha — відмова

## Gates

```powershell
npm run build
npm test
npm run validate
npm run check:add-property
npm run check:notify
npm run verify:render
```

Поза репо (після погодження мережі): `npx wrangler deploy --dry-run`,
`npx wrangler tail`, `Invoke-WebRequest` на `OPTIONS`/`POST`,
`Resolve-DnsName` до/після NS.

## Що потрібно від користувача (блокери)

1. **Cloudflare env**: `CLOUDFLARE_API_TOKEN` і `CLOUDFLARE_ACCOUNT_ID` у
   середовищі сесії. Scopes токена: Zone:Read, Zone:DNS:Edit,
   Workers Scripts:Edit, Turnstile:Edit, Account:Read.
2. **Turnstile sitekey** нового widget-а (hostnames `rent.if.ua`,
   `www.rent.if.ua`, `localhost`). Secret користувач вставляє сам:
   `npx wrangler secret put TURNSTILE_SECRET_KEY --name rent-forms`.
3. **NS у registrar**: після створення зони агент повертає пару NS;
   заміну виконує користувач. Потрібен перелік записів, які не можна
   втратити (MX/TXT/CAA/піддомени), або дозвіл зняти поточні записи
   автоматично перед зміною NS.

## Out of scope

- Перенесення сайту з GitHub Pages на Cloudflare Pages/Workers (лише DNS +
  Worker endpoint + Turnstile)
- Зміна UI/розмітки форм
- Tailwind 4 / інші modernization items
- Поштовий хостинг, окрім збереження наявних записів

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-18: **item створено, статус `blocked`.** Зібрано контракт рушія
  (`runtime/submit.js`, `runtime/modal-form.js`, `runtime/page-form.js`,
  `runtime/shell.js`, `runtime/captcha.js`, `schema/form-config.schema.json`)
  і поточний стан `site.js`/конфігів.

- 2026-11-18: **рішення зафіксовано, статус лишається `blocked`.** Акаунт —
  той самий; доступ — API token + `wrangler`; код — `workers/forms/` у
  `reifua/main`; доставка — як `realtyua/main/workers/*`, окремо для
  `rent.if.ua`; endpoint — `https://forms.rent.if.ua`; NS на Cloudflare,
  GitHub Pages DNS-only; Turnstile — новий widget, secret вставляє
  користувач. Додано план A–D і виявлені прогалини: немає маніфесту
  `form-config.json`, notify-модалка не підключає `captcha.js`.

- 2026-11-18: **відповіді на блокери.** Токен — через env
  (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`); email —
  `info@rent.if.ua` / `noreply@send.rent.if.ua`, Email Routing готовий;
  NS змінює користувач (агент дає пару); `/demo` теж отримує captcha
  (`?form=demo`, без email); `npm install` wrangler дозволено. Лишилось:
  sitekey і поява токена в env.
