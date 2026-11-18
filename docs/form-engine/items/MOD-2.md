# MOD-2 — Purge: сканувати Tailwind-тему з npm-пакета (стилі `/demo`)

Phase: 8 · Depends: MOD-1 · Repo: reifua

Branch: `feat/MOD-2-purge-npm-runtime` · Worktree: `reifua/main`

Status: `review`

## Goal

Повернути стилі production-збірки на `/demo` (і взагалі Tailwind-утиліти, які
компонує рушій). Після PUB-14 рушій переїхав у npm-пакет, а
`tailwind.config.js` досі сканував `./src/assets/js/form-engine/**` — шлях,
якого вже немає. Production-purge тому вирізав усі утиліти теми, яких немає
літералами в `src/**/*.njk`/`test/**`.

## Steps

1. Відтворити: після деплою MOD-1 зібрати `dist` і порахувати, скільки класів
   з HTML не мають правил у CSS (`main.css` + `extras.css` + `bootstrap4.css` +
   inline `<style>`).
2. Замінити застарілі шляхи purge на
   `./node_modules/@realtyua/form-engine/runtime/**/*.js`.
3. Перевірити, що зникли саме утиліти теми, а не з'явився зайвий CSS; гейти.

## Acceptance

- [x] Purge сканує встановлений пакет, а не видалену локальну копію
- [x] `/demo` отримує утиліти теми (`md:col-span-*`, `focus:*`, `hover:*`, ...)
- [x] Гейти: build 0, `T` 238/238, `V` valid, `CA` PASS, `CN` ok, `VR` 42/42
- [ ] Merge у `master` + push (користувач) + перевірка `/demo` на живому сайті

## Gates

```powershell
npm run build
npm test
npm run validate
npm run check:add-property
npm run check:notify
npm run verify:render
```

## Out of scope

- Увімкнення варіантів `active:`/`peer-checked:` у Tailwind 2 або перехід на
  Tailwind 3/4 (окремий item)
- Сканування YAML-конфігів форм (`class:` у `demo.yml`) — там лишаються
  демонстраційні `reclass`/`tooclass`/`kaclass`/`myclass`
- Оновлення версій `actions/*` (застереження Node 20 у Action) — окремий item

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-18: **purge fix** (гілка `feat/MOD-2-purge-npm-runtime` від
  `master` @ `156fd37`).

  Симптом: на задеплоєному `/demo` «поламалися стилі». Замір по 18 HTML-
  сторінках `dist`: **86** різних класів без жодного CSS-правила. Причина —
  `tailwind.config.js` → `purge.content` містив
  `./src/assets/js/form-engine/**/*.js` і
  `./src/assets/js/form-engine/themes/tailwind.js`; після PUB-14 цих файлів
  немає (рушій ставиться з npm), тому `SAFELIST` теми й утиліти, скомпоновані
  в `runtime/themes/tailwind.js`, вирізалися. Це не регресія MOD-1: шлях
  застарів ще в PUB-14, але `/demo` вперше потрапив у `master` лише з
  MERGE-1.

  Зміна: `tailwind.config.js` — замість двох мертвих шляхів
  `./node_modules/@realtyua/form-engine/runtime/**/*.js` (+ комментар, чому).

  Результат: `dist/assets/css/main.css` 19 361 B → **28 671 B**; класів без
  CSS по всьому `dist` **86 → 29**. На `/demo` з 270 класів лишилось 16 без
  CSS, і всі — поза скоупом: `feather*` (іконковий шрифт), `reclass`/
  `tooclass`/`kaclass`/`myclass` (демо-класи з `demo.yml`), `active:*` і
  `peer-checked:*` (немає в дефолтних варіантах Tailwind 2.2.19),
  `captcha-widget*` та `leaflet-attribution-flag` (хуки/leaflet, були
  відсутні й раніше).

  Гейти: `npm run build` 0, `npm test` **238/238**, `validate --strict` valid,
  `check:add-property` PASS, `check:notify` ok (10 pages), `verify:render`
  **42/42**.

  Leftovers: merge у `master` після «прийнято», push і візуальна перевірка
  `/demo` на сайті — користувач. Застереження Action про Node 20 в
  `actions/*@v4` — не помилка (actions примусово на Node 24); оновлення тегів
  потребує перевірки актуальних версій — окремий item.

- 2026-11-18: **прийнято → локальний цикл виконано** (`reifua`).

  Item-коміт `92c773e` (`MOD-2: scan form-engine theme from npm in purge`),
  merge `--no-ff` у `reifua/master` — `4c94ecc`; гілку
  `feat/MOD-2-purge-npm-runtime` видалено. Після merge: `npm run build` 0,
  `npm test` **238/238**, класів без CSS по `dist` — **29** (було 86).

  Статус `review`: `master` на 2 коміти попереду `origin/master`; push і
  візуальна перевірка `/demo` на живому сайті — за користувачем.
