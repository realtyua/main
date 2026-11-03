# JEK-R1 — Leaflet dedup: `head.html`, `java-script.html`, порожній блок

Phase: 3 · Depends: BASE-5 · Repo: realtyua
Branch: `feat/JEK-R1-leaflet-dedup` · Worktree: `../worktrees/JEK-R1-leaflet-dedup`

Status: `review`

## Goal

На `/new.html` (форма `add-property`) має бути **рівно один** Leaflet CSS та
**рівно один** Leaflet JS. Дублювання з `_includes/head.html` та
`_includes/java-script.html` прибирається. CSS/JS Leaflet лишається лише в
згенерованому фрагменті `_includes/form/app/add-property.html`.

## Files

- `_includes/head.html` (рядки 154–157) — видалити блок під
  `page.form == 'add-property'` з inline
  `<style>{%- include css/leaflet.css -%}</style>` та `preconnect` до jsdelivr.
- `_includes/java-script.html` (рядки 39–43) — видалити порожній блок
  `{% if page.layout == 'property' %}{% endif %}` та скрипт
  `{% if page.form == 'add-property' %}<script>{%- include js/leaflet.js -%}</script>{% endif %}`.

## Steps

1. Створити worktree та гілку `feat/JEK-R1-leaflet-dedup` (detached HEAD → checkout).
2. У worktree зробити junction `node_modules` на `../../main/node_modules`
   (без `npm install`).
3. Прогнати baseline-гейти до змін: `npm test`, зафіксувати стан
   `verify-render.ps1 verify`.
4. Видалити дублювання в `_includes/head.html` та `_includes/java-script.html`.
5. Прогнати гейти після змін: `npm test`, `verify-render.ps1 verify`.
   Перевірити, що diff містить лише прибрані Leaflet-блоки.
6. Перевірити `_site/new.html`: рівно один `<style>` з Leaflet та рівно один
   `<script>` з Leaflet.
7. Handoff + оновити `docs/form-engine/WORKITEMS.md`.

## Acceptance

- У `head.html` прибрано блок для `page.form == 'add-property'` (рядки 154–157).
- У `java-script.html` прибрано порожній блок + скрипт для
  `page.form == 'add-property'` (рядки 39–43).
- На `/new.html` — рівно один Leaflet CSS та рівно один Leaflet JS
  (з `_includes/form/app/add-property.html`).
- Property-сторінки лишаються працездатними (Leaflet підтягується з
  `main.l.css`/`main.l.js`).
- `npm test` — без регресій (у канонічному чекауті 214/214; у свіжому
  Windows-worktree відомий EOL-fail JEK-R8).
- `verify-render.ps1 verify` показує diff лише через видалення дублювання
  (жодного re-capture baseline).

## Gates

```powershell
npm test
powershell -File _form-engine/tools/verify-render.ps1 verify
```

## Out of scope

- Re-capture baseline / виправлення config drift у `new.html` (JEK-R3/R7).
- CSP (`cdn.jsdelivr.net`) — окремий item.
- `reifua` — EL-1.
- Мертвий код/legacy partial-и — JEK-R5.
- Зміна вмісту `_includes/form/app/add-property.html` (generated).
- EOL-нормалізація (`.gitattributes`) — JEK-R8.

## Handoff log

- 2026-11-02: Створено item. Початок сесії JEK-R1.
- 2026-11-03: Завершено. Змінено лише два шаблони:
  `_includes/head.html` (прибрано `preconnect` до jsdelivr і
  `<style>{%- include css/leaflet.css -%}</style>` для `add-property`) та
  `_includes/java-script.html` (прибрано порожній блок
  `page.layout == 'property'` і `<script>{%- include js/leaflet.js -%}</script>`
  для `add-property`). Разом −9 рядків.
- Generated `_includes/form/app/add-property.html` після кожного build
  змінюється лише в `sha=` та `?v=` — відкочено до `HEAD`, у diff не входить.
- Гейти: `npm test` — 214/214. `verify-render.mjs verify` — ті самі
  pre-existing розбіжності (stale baseline `new.html` + `site.url` JEK-R2,
  `form-config.json` JEK-R3, notify JEK-R2); Leaflet-блоків у diff немає.
  Baseline не перезаписувався. `verify-render.ps1` додатково падає на
  `check-notify` («missing app.js» на property-сторінці) — pre-existing,
  не JEK-R1.
- Build: `jekyll build --limit_posts 1` з тимчасовим offline-override
  (`jekyll_get_json: []`, файл поза репо). `_site/new.html`: рівно один
  Leaflet `<style>`, рівно один Leaflet `<script>`, `preconnect` jsdelivr — 0;
  `leaflet-container/pane/tile` 44/14/36 → 22/7/18. Property-сторінка
  зберігає Leaflet через `main.l.css`/`main.l.js`.
- Ручна перевірка користувачем: `jekyll serve --limit_posts 1` на
  `http://localhost:4000/` — форма й карта працюють.
- Commit SHA: немає (агент не комітить; staging/commit/merge — користувач).
