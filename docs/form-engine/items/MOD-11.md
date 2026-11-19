# MOD-11 — Контракт дій/chrome форм (submit/reset) для page і modal

Phase: 8 · Depends: MOD-9 · Repo: form-engine + realtyua
Branch: `feat/MOD-11-form-actions-chrome` · Worktree: `../worktrees/MOD-11-form-actions-chrome`

Status: `todo`

> Винесено з MOD-9. У page/wizard кнопки навігації/submit генеруються chrome,
> тоді як modal-форма зараз очікує явні елементи в конфігу/DOM (або legacy
> hardcode), через що конфіг без submit-кнопки не має передбачуваної дії.

## Goal

Єдиний і передбачуваний контракт дій форми для `page` та `modal`: як
оголошуються, генеруються або перевизначаються `submit`/`reset`/`cancel` (і
пов’язані стани), незалежно від місця розміщення форми.

## Files

- `form-engine/runtime/shell.js`, `runtime/render.js`, `runtime/themes/*.js` — chrome/actions рендеринг
- `form-engine/runtime/page-form.js`, `runtime/modal-form.js` — wiring дій і станів
- `form-engine/schema/**` — опис контракту дій (за потреби)
- `realtyua/assets/js/form-engine/**`, baked fragments, тести, docs

## Steps

1. Визначити контракт: де задаються дії (config/chrome/behavior), які дії обов’язкові за замовчуванням для page/modal, як робити override/кастомні кнопки.
2. Реалізувати генерацію/прив’язку submit (і за потреби reset/cancel/close) для modal-режиму на рівні рушія; узгодити з page/wizard chrome.
3. Забезпечити доступність і стани кнопок (disabled/loading/success/error/retry) через спільні hooks/атрибути.
4. Додати тести: modal без явної submit-кнопки, кастомна кнопка, регресія wizard page-форм.
5. Оновити документацію, приклади та міграційні нотатки.

## Acceptance

- [ ] Валідна modal-конфігурація має передбачуваний спосіб відправки без покладання на legacy notify-ID
- [ ] Page і modal використовують узгоджений контракт дій/chrome (з можливістю розширення/override)
- [ ] Стани дій (loading/disabled/error/success) відпрацьовують коректно в обох режимах (де застосовно)
- [ ] Тести покривають дефолтну генерацію та override

## Gates

```powershell
# form-engine
npm test

# realtyua (після sync/інтеграції)
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
bundle exec jekyll build --limit_posts 1
```

## Out of scope

- Повна уніфікація всіх modal lifecycle-хуків поза діями/chrome (див. MOD-10)
- Паритет dnscheck/async-валідацій (див. MOD-12)
- 11ty parity, публікація npm, push

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
