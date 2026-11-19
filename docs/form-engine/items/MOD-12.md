# MOD-12 — Паритет валідації та async-перевірок (page/modal)

Phase: 8 · Depends: MOD-9 · Repo: form-engine + realtyua
Branch: `feat/MOD-12-validation-parity` · Worktree: `../worktrees/MOD-12-validation-parity`

Status: `todo`

> Винесено з MOD-9. Виявлено, що однакові/схожі поля поводяться по-різному в
> `page-form.js` та `modal-form.js` (зокрема `dnscheck` для `email` реалізований
> у page-runtime і відсутній у modal), а частина правил/повідомлень залежить від
> режиму та glue-коду.

## Goal

Єдині правила синхронної та асинхронної валідації для полів/віджетів у `page` і
`modal` режимах (де це застосовно): `required`, `pattern`, `min/max/length`,
`feedback/validation` повідомлення, `dnscheck`, captcha-gating та інші glue-перевірки
працюють узгоджено.

## Files

- `form-engine/runtime/page-form.js`, `runtime/modal-form.js` — винесення/спільне використання валідаційного glue
- `form-engine/runtime/controller.js`, `runtime/binder.js`, `runtime/data.js` — правила/стани/повідомлення
- `form-engine/runtime/themes/*.js` — атрибути/розмітка, що впливають на валідацію/feedback
- тести валідації, email/dnscheck, captcha-gating; docs/schema

## Steps

1. Інвентаризувати відмінності валідації між page і modal (sync + async: `dnscheck`, captcha, pattern/length/required, feedback mapping).
2. Виділити спільний валідаційний пайплайн/утиліти (або уніфікувати виклики) для обох режимів; прибрати дублювання.
3. Забезпечити підтримку `validation.dnscheck` у modal-runtime з тим самим UX/станами, що й у page-runtime (де застосовно).
4. Уніфікувати інтерпретацію `pattern`/`validation.pattern`/`feedback` та відображення помилок/valid-state.
5. Додати тести паритету (той самий конфіг поля → очікувана поведінка в page і modal, з урахуванням mode-specific обмежень).

## Acceptance

- [ ] `type: email` з `validation.dnscheck` працює у modal так само, як у page (для еквівалентного контексту)
- [ ] Базові правила валідації (`required`, `minlength/maxlength`, `pattern`, повідомлення) інтерпретуються узгоджено між режимами
- [ ] Captcha/submit блокування при невалідному стані узгоджене та передбачуване
- [ ] Є тести паритету/регресії для page і modal

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

- Генерація/контракт submit/chrome (див. MOD-11)
- Повний config-driven modal lifecycle поза валідацією (див. MOD-10)
- 11ty parity, публікація npm, push

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
