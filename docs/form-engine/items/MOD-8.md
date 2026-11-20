# MOD-8 — Свідоме перезахоплення baseline `verify-render`

Phase: 8 · Depends: MOD-6, MOD-7 · Repo: realtyua

Branch: `feat/MOD-8-baseline-recapture` · Worktree: `../worktrees/proud-cactus`
(сесійний worktree; погоджено користувачем 2026-11-20 замість імені з реєстру)

Status: `review`

> Окрема сесія. Основний акт — **перегляд кожної розбіжності**, а не «зелений
> гейт будь-якою ціною». Заборонено послаблювати нормалізатор і «лікувати»
> baseline.

## Goal

Після MERGE-2, MOD-6 і MOD-8 знімок `_form-engine/baseline/` знову відповідає
поточному рендеру, а кожна зміна в ньому усвідомлено задокументована.

## Поточний стан (на 2026-11-18)

`verify-render.ps1 verify` — FAIL 2/3; baseline захоплено 2026-11-08:

1. `new.html` — тільки `form-bake name=add-property sha`:
   `0651f32a…` → `08e2d3c7…`. Причина: PUB-18 rebake `e301affb`
   (2026-11-18). Користувацький коміт `fd4978c6` (`_data/add-property.yml`)
   може змінити SHA ще раз — перевірити свіжий diff.
2. NEW POST у трекованій property-сторінці:
   `district/town/kosiv/apartment/prodam-1789988154.html` →
   `region/city/yaremche/house/prodam-budynok-1794757537.html` (новий пост
   із `master`).

Обидві розбіжності — застарілий еталон, не регресія злиття.

## Files

- `_form-engine/baseline/.render-baseline.json` (`capturedAt`, tracked post)
- `_form-engine/baseline/new.html.txt`
- решта файлів `_form-engine/baseline/` — лише за реальною потребою

## Steps

1. Достроково не запускати `capture`: спершу дочекатися MERGE MOD-6 і MOD-7 —
   обидва можуть вплинути на рендер `head.html`.
2. Прогнати `verify`, зберегти повний diff для кожного з 3 трекованих файлів.
3. Переглянути кожен diff in-place, записати причину в handoff.
4. За наявності неочікуваних змін — зупинитися й уточнити в користувача, а не
   перезахоплювати.
5. `verify-render.ps1 capture`, потім повторний `verify` — має бути 3/3.
6. Оновити metadata (`capturedAt`) і реєстр; handoff; локальний цикл після
   «прийнято».

## Acceptance

- [x] Кожна розбіжність переглянута й має письмове пояснення в handoff
- [x] Немає змін у normalisator/гейтах, зроблених заради green
- [x] `verify` після `capture` — 3/3
- [x] У реєстрі/`MERGE-2.md` зафіксовано дату перезахоплення

## Gates

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
node _form-engine/tools/check-notify.mjs
powershell -File _form-engine/tools/verify-render.ps1 verify
```

`B` виконується всередині `verify-render` (~175 с).

## Out of scope

- Зміни в конфігах форм, темі, runtime, `head.html` (MOD-6/MOD-7)
- Прибирання статусу MERGE-2 (він `done`)
- push

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->

- 2026-11-20: **review** — усі три розбіжності переглянуті in-place до `capture`,
  причини зафіксовані нижче; жодних змін у нормалізаторі чи гейтах не робилося.

  **Baseline-гейти до змін:** `V` 3/3 valid; `T` 221/226 (5 відомих failure: 3
  autocomplete, stale baked form, notify `action` `notify_property` vs `notify`);
  `CA` 4 failure (autocomplete, успадковані з MOD-6/7/9); `CN` ok (1 page) усередині
  `verify-render`; `VR` FAIL 3/3 із трьома розбіжностями.

  **Перегляд розбіжностей (жодна не є регресією):**

  1. `new.html` (333506 → 330786 символів). Дві логічні зміни:
     (а) `form-bake name=add-property sha` `0651f32a…` → `1fff85ef…` — наслідок
     зміни конфігу; (б) digest двигуна `app.js?v=ac3e5f573ec1` →
     `?v=dfd5e06ed9a3` (перехід на `@realtyua/form-engine@1.0.7`). У JSON-острівці
     та рендері видалено поле `district_settlement` (коміт користувача `fd4978c6`
     «Toggle line comment 893-921», 2026-11-18) і додано
     `email.validation.pattern` (коміт `b3f2fdb4` «Update config YAML»,
     2026-11-19). Перевірено: префікс ідентичний після маскування sha, а суфікс —
     після видалення рядка `data-field-col="district_settlement"`; `turnstile`
     трапляється 1 раз в обох версіях. Інших відмінностей немає.
  2. `assets/data/form-config.json` (29368 → 28631). Порівняно по іменах полів:
     46 → 45, єдина видалена назва — `district_settlement`, єдина зміна вмісту —
     `email.validation.pattern`; порядок решти полів не змінився, секції
     `location`, `locationWidget`, `captcha`, `settings` ідентичні. Причини — ті
     самі коміти `fd4978c6` і `b3f2fdb4`.
  3. Новий пост у трекованій property-сторінці:
     `district/town/kosiv/apartment/prodam-1789988154.html` →
     `region/city/yaremche/house/prodam-budynok-1794757537.html`. Фрагмент notify
     перейшов із legacy raw island на engine-baked modal (MOD-9):
     `form-bake name=notify sha=9940cf558ae0…`, `theme: bootstrap4`,
     `action: notify_property`, власні блоки error/success і кнопка submit.
     Острів `notify-page` має `uid: 1794757537` (збігається з назвою файлу) і
     абсолютний `property_url`; `app.js` підключено один раз, `api.js` і
     `captcha.js` — 0. `check-notify` — ok (1 page).

  **Capture/verify:** `verify-render.ps1 capture` — 2026-11-20T09:27:32.288Z;
  повторний `verify` (з повним `jekyll build --limit_posts 1`, ~255 с) —
  **PASS 3/3**, `check-notify` ok.

  **Гейти після змін:** `V` 3/3; `CA` 4 failure (без змін); `CN` ok; `VR` 3/3;
  `T` 222/226 одразу після build (freshness-тест почав проходити, бо Jekyll
  перейпек запечені фрагменти) і 221/226 після їх відновлення до HEAD — повернуто
  до вихідного стану 4 відомі failure, жодного нового.

  **Файли:** змінено `_form-engine/baseline/{new.html.txt,
  assets__data__form-config.json.txt, .render-baseline.json}`, додано
  `_form-engine/baseline/region__city__yaremche__house__prodam-budynok-1794757537.html.txt`,
  видалено сироту
  `_form-engine/baseline/district__town__kosiv__apartment__prodam-1789988154.html.txt`.
  За погодженням користувача tracked
  `_includes/form/app/{add-property,notify}.html` повернуто до HEAD (свіжість
  запечених фрагментів — відомий leftover MOD-9, не цей item). Документи:
  цей handoff, `WORKITEMS.md`, `items/MERGE-2.md`.

  **Leftovers:** 4 failure `T` і 4 failure `CA` — відомі, поза scope (MOD-9 /
  autocomplete); `git push` — користувач. Локальний цикл після «прийнято»:
  коміт `<ID>: …` → `git merge --no-ff` у `master` (за практикою MOD-6/7/9,
  бо `feature/form-engine` відстає і не є деploy-гілкою) → локально підтягнути
  `feature/form-engine` до `master` → зняти junction і прибрати worktree.
  Commit SHA — **після схвалення**.
