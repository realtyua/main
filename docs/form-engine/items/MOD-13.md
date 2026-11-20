# MOD-13 — Тріаж autocomplete drift (`check-add-property` + `add-property-wire`)

Phase: 8 · Depends: MOD-9 · Repo: realtyua

Branch: `feat/MOD-13-autocomplete-drift` · Worktree: `../worktrees/MOD-13-autocomplete-drift`

Status: `todo`

> Винесено з MOD-8/MOD-9. Після видалення поля `district_settlement` із
> `_data/add-property.yml` (коміт користувача `fd4978c6`, 2026-11-18) і rebake
> двигуна 1.0.7 гейт `check-add-property.mjs` і тести `add-property-wire.test.mjs`
> досі очікують старі autocomplete-маркери. Живі форми працюють (підтверджено
> на `master`); це **drift очікувань**, а не регресія рендеру чи runtime.

## Goal

Свідомо вирішити долю застарілих autocomplete-очікувань і зафіксувати результат
у гейтах/тестах, не послаблюючи їх формально:

- `check-add-property.mjs` — **0 failures** (замість поточних 4);
- 3 autocomplete-фейли `test/add-property-wire.test.mjs` проходять;
- решта відомі failure (`stale baked form`, notify `action`) не зростають
  і лишаються за межами цього item-а.

## Поточний стан (базис на 2026-11-20)

- `node _form-engine/tools/check-add-property.mjs` — **4 failures**:
  `autocomplete main control`, `autocomplete select`,
  `autocomplete placeholder option`, `autocomplete search hook`
  (усі — про `district_settlement`).
- `npm test` — **221/226**; 3 фейли в `test/add-property-wire.test.mjs`
  (`district_settlement`/`type_address` autocomplete controls not mounted),
  ще 2 — відомі залишки MOD-9 (`stale baked form`, notify `action`).
- `V` 3/3, `VR` 3/3, `CN` ok. MOD-8 щойно перезахопив baseline — його
  перезахоплення в цьому itemі не потрібне.

## Decision point

Перед змінами зафіксувати рішення (і причину) в handoff:

1. **Оновити очікування (рекомендовано)** — поле видалено свідомо, тому
   замінити 4 позитивні перевірки на явний негативний/актуальний контракт
   (за прецедентом JEK-R4), а 3 тести — на поточну autocomplete-розмітку
   `type_address`. Це не послаблення гейта, а фіксація нової реальності.
2. **Повернути `district_settlement`** — тільки за явним рішенням користувача;
   наслідок: зміна конфігу/rebake і **повторне перезахоплення baseline**
   після MOD-8 (окреме рішення, не «заодно»).

## Files

- `_form-engine/tools/check-add-property.mjs` — 4 перевірки `district_settlement`
- `test/add-property-wire.test.mjs` — 3 autocomplete-тести
- `_data/add-property.yml` — **лише** якщо обрано варіант 2 (з дозволу)
- `_includes/form/app/add-property.html` — generated, не редагувати вручну
- `docs/form-engine/items/MOD-13.md`, `docs/form-engine/WORKITEMS.md`

## Steps

1. Прогнати baseline-гейти до змін і зберегти виводи (4 CA / 3 T / 2 інші).
2. Узгодити decision point із користувачем; записати вибір у handoff.
3. Для варіанту 1: замінити застарілі позитивні перевірки на явні негативні
   або перевірки фактичних хуків; оновити 3 тести під поточну розмітку.
   Не видаляти перевірки «мотузованим» способом і не змінювати нормалізатор.
4. Для варіанту 2: повернути поле, rebake, переглянути diff, окремо вирішити
   питання baseline MOD-8.
5. Прогнати гейти після змін; перевірити, що нових failure не додано.
6. Handoff, статус у реєстрі, локальний цикл після «прийнято». Push — користувач.

## Acceptance

- [ ] Рішення (вар. 1 або 2) і його причина зафіксовані в handoff
- [ ] `check-add-property.mjs` — 0 failures без послаблення контракту
- [ ] 3 autocomplete-тести проходять; загальний `T` — 224/226 або краще,
      решта 2 failure лишаються відомими й не є новими
- [ ] `V` 3/3, `VR` 3/3, `CN` ok
- [ ] Жодних змін у runtime/темах/конфігах без окремого рішення

## Gates

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/check-add-property.mjs
node _form-engine/tools/check-notify.mjs
powershell -File _form-engine/tools/verify-render.ps1 verify
```

## Out of scope

- Фікс `stale baked form` і notify `action` (`notify_property` vs `notify`) — залишки MOD-9
- Повторне перезахоплення baseline MOD-8 (окремий акт за потреби)
- 11ty parity, публікація npm, push

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
