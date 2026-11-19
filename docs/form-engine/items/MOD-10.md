# MOD-10 — Modal runtime: config-driven lifecycle (уніфікація)

Phase: 8 · Depends: MOD-9 · Repo: form-engine + realtyua
Branch: `feat/MOD-10-modal-runtime-unify` · Worktree: `../worktrees/MOD-10-modal-runtime-unify`

Status: `todo`

> Винесено з MOD-9. Під час підгонки notify під переписаний `_data/notify.yml`
> виявлено, що `modal-form.js` фактично реалізує notify-специфічний сценарій
> (жорсткі селектори/ID, фіксована дія captcha, очікування конкретних елементів
> статусу/submit/retry), тому довільна modal-конфігурація не є переносною.

## Goal

`behavior.mode: modal` працює для довільної валідної конфігурації форми через
config-driven lifecycle у modal-runtime: монтування, reset, submit, показ
станів/помилок, інтеграція captcha та page-context визначаються конфігом/контрактом,
а не хардкодом під конкретну форму.

## Files

- `form-engine/runtime/modal-form.js` (або відповідний шлях у пакеті/сайті після sync)
- `form-engine/runtime/app.js`, `runtime/shell.js`, `runtime/render.js` — за потреби контракту
- `form-engine/runtime/captcha.js`, `runtime/data.js`, `runtime/submit.js` — за потреби
- `realtyua/assets/js/form-engine/**` — синхронізація/адаптація споживача
- тести modal/runtime, docs/schema (за потреби)

## Steps

1. Зафіксувати цільовий контракт modal-конфігу: `behavior.modal`, mount/endpoint, джерело page-context, прив’язка submit/status/error/success/retry, captcha (`element_id/action/token/required`), reset hooks.
2. Прибрати hardcode notify-ID/дій із `modal-form.js`; зробити резолв елементів і поведінки від конфігу/DOM-контракту з сумісним fallback для існуючих форм.
3. Уніфікувати lifecycle подій модалки (Bootstrap show/shown/hidden), reset форми/станів, обробку помилок воркера/капчі.
4. Оновити/додати тести на generic modal-config (не лише notify) та регресію notify/add-property/demo.
5. Оновити документацію/приклади; синхронізувати в realtyua/reifua за потреби.

## Acceptance

- [ ] Modal-runtime не містить обов’язкових hardcode-залежностей від `notify-*` ID або фіксованої captcha-дії для роботи нових конфігів
- [ ] Конфіг `behavior.mode: modal` з власними іменами/елементами монтується і відпрацьовує lifecycle (open/reset/validate/submit/success/error) за контрактом
- [ ] Існуючий notify-сценарій лишається працездатним (backward compatibility або задокументована міграція)
- [ ] Тести покривають generic modal-case і регресію notify

## Gates

```powershell
# form-engine
npm test

# realtyua (після sync/інтеграції)
npm test
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/check-notify.mjs
bundle exec jekyll build --limit_posts 1
```

## Out of scope

- Повний редизайн wizard/page chrome (див. MOD-11)
- Повний паритет усіх field/widget/glue можливостей між режимами (див. MOD-12)
- 11ty parity, публікація npm, push

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
