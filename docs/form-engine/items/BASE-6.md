# BASE-6 — `reifua`: доля `src/assets/data/**`

Phase: 2 · Depends: BASE-5 · Repo: reifua
Branch: `feat/BASE-6-reifua-data` · Worktree: `../worktrees/BASE-6-reifua-data`

Status: `done`

## Goal

Перевірити, що закомічені 27 файлів `src/assets/data/**` у `reifua` справді
потрібні, відтворювані й не заважають збірці — або прибрати їх з репозиторію.
Після item немає ні «висячих» даних, ні сумнівів щодо їхнього походження.

## Статус: файли вже закомічені

Під час BASE-4 планувалося лишити теку untracked. Фактично коміт `7a95f78`
у `reifua/feature/form-engine` містить усі 27 файлів разом із рушієм.
Історію не переписували. Тому item тепер не «вирішити, чи трекати», а
**«перевірити доцільність і узгодженість»**.

## Контекст (знайдено в BASE-4)

- 27 файлів, разом **~7.9 MB**: `all.json` (571 KB), `lviv.json` (533 KB),
  `pl.json` (507 KB), `kh.json`, `zt.json`, `dp.json`, `vn.json`, `cn.json`,
  `ck.json`, `cv.json`, `if.json`, `km.json`, `kr.json`, `ks.json`,
  `kyiv.json`, `lt.json`, `mk.json`, `odesa.json`, `rv.json`, `sm.json`,
  `te.json`, `uz.json`, `zp.json`, `districts.json`,
  `districts-30559.json`, `info`, `scraper.py`.
- Це **дані сайту**, не Form Engine.
- `realtyua` тримає 28 аналогічних файлів у `assets/data` трекованими.
- `.eleventy.js` уже має `config.addPassthroughCopy('src/assets/data/')`,
  тобто build очікує цю теку.
- `reifua/.gitignore` цих файлів не ігнорує.

## Питання, на які item має відповісти

1. Чи `reifua` взагалі рендерить сторінки, що споживають ці дані?
2. Чи дані відтворювані з `scraper.py` (тоді — генерація, а не коміт)?
3. Чи `scraper.py` і `info` — службові артефакти, яким не місце в репо?
4. 7.9 MB одноразово — прийнятно для репозиторію, чи варто Git LFS /
   зовнішнє джерело?

## Steps

1. Grep `src/**` на звернення до `assets/data/`.
2. Перевірити, чи build без цих файлів щось ламає.
3. Рішення зафіксувати одним із варіантів:
   - **A** — `git add src/assets/data` окремим комітом `chore(data): region datasets`;
   - **B** — `.gitignore` + документована команда генерації;
   - **C** — Git LFS.
4. Якщо B: перевірити, що `addPassthroughCopy` не ламає build на чистому клоні.

## Acceptance

- `git status` у `reifua` чистий (без вічних untracked).
- Рішення й обґрунтування записані в handoff.
- Чистий клон `reifua` збирається (`npm run build`).

## Gates

```powershell
cd ..\..\reifua\main
npm run build
```

## Out of scope

- Синхронізація рушія (EL-1) і сторінки 11ty (EL-2…EL-4).
- Зміст самих даних і логіка скрейпера.

## Handoff log

- 2026-11-01: item створено під час BASE-4. Файли лишено untracked; рішення
  відкладено, щоб не змішувати дані сайту з комітами рушія.
- 2026-11-02: файли закомічено в `7a95f78` разом з рештою змін `reifua`.
  Item переорієнтовано з «вирішити, чи трекати» на «перевірити доцільність».
- 2026-11-18: **verified + trimmed** (worktree `BASE-6-reifua-data`, branch
  `feat/BASE-6-reifua-data`, без коміту).

  Рішення: лишити трекованими **тільки фактично вживані** файли — `if.json`
  (239 446 B) і `districts.json` (1 545 B). Видалено 25 файлів (8 003 822 B):
  `all.json`, `districts-30559.json`, 22 регіональні `.json`, `info`,
  `scraper.py`.

  Обґрунтування (відповіді на питання item):
  1. `src/**` звертається лише до `all.json` / `districts.json` /
     `districts-30559.json`; регіональні файли не читає ніщо.
  2. `all.json` — не «вся Україна», а вирізка з 2 областей: `if.json[0]` +
     `kyiv.json[0]` (перевірено, entries ідентичні). Тому `all.json` замінено
     на `if.json` у `data:` location-віджета.
  3. Дані не відтворювані: `scraper.py` ходить у мережу, приймає один
     oblast id і пише hardcode `if_oblast_data.json`; пайплайну для 23 назв
     немає. Усі 27 файлів були байт-ідентичні (EOL-нормалізовано)
     `realtyua/assets/data/*` — тобто копія, а не генерація.
  4. 7.9 MB одноразово — прийнятно, LFS не потрібен: `add-property-wire`
     читає `if.json` з диска, LFS вимагав би `lfs pull` (мережа) для гейтів.

  Зміни (`reifua`):
  - `src/assets/data/`: видалено 25 файлів, лишились `if.json`, `districts.json`.
  - `src/_data/add-property.yml`, `src/_data/demo.yml`: `data:`
    `/assets/data/all.json` → `/assets/data/if.json`; datas-гілка для `30559`
    (`districts-30559.json`) закоментована.
  - `test/add-property-wire.test.mjs`: читання/моки `all.json` → `if.json`;
    тест `autocomplete datas switch…` (єдина залежність від
    `districts-30559.json`) видалено.

  Гейти (worktree, `node_modules` — junction):
  - `npm run build` — exit 0; `dist/assets/data` 27→2 файли
    (8 244 813 B → 240 991 B);
  - `npm test` — 238/238 pass (було 239; −1 видалений тест);
  - `npm run validate --strict` — valid; `check:add-property` — PASS;
    `check:notify` — ok (10 pages); `verify:render` — PASS 42/42.

  Leftovers: `dist` більше не тягне 7.6 MB мертвих даних; `all.json` більше
  не згадується в `src/**`.

  Коміт: `cd2fb02` (`BASE-6: trim region datasets to used files`), merge
  `--no-ff` у `reifua/feature/form-engine` — `dcf1ee7`. Гілку
  `feat/BASE-6-reifua-data` і worktree прибрано; junction `node_modules`
  знято.
